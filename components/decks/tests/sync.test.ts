import axios from "axios";
import { connectToTestDB, disconnectFromDB } from "../../../db";
import {
  decksTestCases,
  rawCardsTestData1,
  reversoTestResponse,
} from "../../../test/testcases";
import { getBuffer } from "../../../utils";
import { globalCardsStore } from "../../flashcards/cards";
import { UserJobsManager } from "../../schedule";
import { globalUserStore, User } from "../../users/user";
import { DynamicSyncData, DynamicSyncType } from "../../users/user.util";
import { Deck } from "../deck";
import { DecksService } from "../services/decks.service";
import { filterByCustomId, ReversoFetcher, SyncClient } from "../sync";
import { UserDeck, UserDecksClient, userDecksManager } from "../userDeck";

describe("Sync client:filterByCustomId ", () => {
  let user: User;
  beforeAll(async () => {
    await connectToTestDB();
    user = await globalUserStore.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
  });

  it("filterByCustomId, case 1", async () => {
    const dbDeck = await DecksService.createDeck({
      createdBy: user.id,
      canBePublic: true,
      name: String(Math.random()) + "-deck",
      totalCardsCount: 0,
    });
    const deck = new Deck(dbDeck);
    const cards = await globalCardsStore.createCards(rawCardsTestData1, deck);
    expect(cards.length).toBe(rawCardsTestData1.length);

    const filtered1 = filterByCustomId(rawCardsTestData1, cards);
    expect(filtered1.length).toBe(0);

    const newRawCard = {
      srcLang: "English",
      trgLang: "Russian",
      srcText: "hello",
      trgText: "привет",
      customId: "3",
    };
    const newRawCards = [...rawCardsTestData1, newRawCard];
    const filtered2 = filterByCustomId(newRawCards, cards);
    expect(filtered2.length).toBe(1);
    expect(filtered2).toContain(newRawCard);
    expect(filtered2).not.toContain(rawCardsTestData1);
  });
  it("filterByCustomId, case 2", () => {
    const newRawCard = {
      srcLang: "English",
      trgLang: "Russian",
      srcText: "hello",
      trgText: "привет",
      customId: "3",
    };
    const newRawCards = [...rawCardsTestData1, newRawCard];
    const filtered = filterByCustomId(newRawCards, []);
    expect(filtered.length).toBe(3);
    expect(filtered).toEqual(newRawCards);
  });
  it("filterByCustomId, case 3", () => {
    const newRawCard = {
      srcLang: "English",
      trgLang: "Russian",
      srcText: "hello",
      trgText: "привет",
      customId: "3",
    };
    const filtered = filterByCustomId([newRawCard], []);
    expect(filtered.length).toBe(1);
    expect(filtered).toContain(newRawCard);
  });
  it("filterByCustomId, case 4", () => {
    const newRawCard = {
      srcLang: "English",
      trgLang: "Russian",
      srcText: "hello",
      trgText: "привет",
    }; // спорный момент, отсутствие customId
    const filtered = filterByCustomId([newRawCard], []);
    expect(filtered.length).toBe(0);
    expect(filtered).not.toContain(newRawCard);
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

jest
  .spyOn(UserJobsManager.prototype, "updateJob")
  .mockImplementation(() => null);

const spyGetRawCards = jest
  .spyOn(ReversoFetcher.prototype, "getRawCards")
  .mockImplementation(async () => rawCardsTestData1);

describe("Sync client: syncHandler", () => {
  let user: User;
  let udclient: UserDecksClient;
  let userDeck: UserDeck;
  let dynUserDeck: UserDeck;
  const tc = decksTestCases.case1;
  const buffer = getBuffer(tc.pathToFile);
  const type: DynamicSyncType = DynamicSyncType.reverso;
  const data: DynamicSyncData = { accountName: "test" };
  const syncClient = new SyncClient(type, data);

  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    user = await globalUserStore.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    udclient = await userDecksManager.getUserDecksClient(user);
    userDeck = (await udclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: "deck",
    })) as UserDeck;

    dynUserDeck = (await udclient.createDynamicUserDeck()) as UserDeck;
    dynUserDeck.setCardsCount = async () => dynUserDeck;
  });

  it("not dynamic user deck", async () => {
    try {
      await syncClient.syncHandler(userDeck);
    } catch (error) {
      expect(error).toMatchObject({
        message: "Dynamic userDeck is required",
      });
    }
  });

  it("deck doesn't exist", async () => {
    await udclient.deleteDynamicUserDeck();
    try {
      await syncClient.syncHandler(dynUserDeck);
    } catch (error) {
      expect(error).toMatchObject({
        message: "Deck doesn't exist",
      });
    }
  });

  it("should call these functions", async () => {
    const spyGetCards = jest.spyOn(globalCardsStore, "getCardsByDeckId");
    const spyCreateCards = jest.spyOn(globalCardsStore, "createCards");
    const spySetCardsCount = jest.spyOn(dynUserDeck, "setCardsCount");
    await syncClient.syncHandler(dynUserDeck);
    expect(spyGetCards).toBeCalledWith(dynUserDeck.deckId);
    expect(spyGetRawCards).toBeCalled();
    expect(spyCreateCards).toBeCalled();
    expect(spySetCardsCount).toBeCalled();
  });

  it("ReversoFetcher: getRawCards", async () => {
    let reversoFetcher = new ReversoFetcher({});
    try {
      await reversoFetcher.getRawCards();
    } catch (error) {
      expect(error).toMatchObject({
        message: "Account name is undefined",
      });
    }

    reversoFetcher = new ReversoFetcher(data);
    spyGetRawCards.mockRestore();

    jest.spyOn(axios, "get").mockImplementation(async () => null);
    try {
      await reversoFetcher.getRawCards();
    } catch (error) {
      expect(error).toMatchObject({
        message: "Reverso fetch data error",
      });
    }

    jest.spyOn(axios, "get").mockImplementation(async () => {
      return { data: { results: "something" } };
    });
    try {
      await reversoFetcher.getRawCards();
    } catch (error) {
      let err = error as Error;
      expect(err.message).toBe("Reverso results must be an array");
    }

    const spyAxiosGet = jest
      .spyOn(axios, "get")
      .mockImplementation(async () => {
        return { data: reversoTestResponse };
      });
    const result = await reversoFetcher.getRawCards();
    expect(spyAxiosGet).toBeCalled();
    expect(result[0].customId).toBe(String(reversoTestResponse.results[0].id));
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});
