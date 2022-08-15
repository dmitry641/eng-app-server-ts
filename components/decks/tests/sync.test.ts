import axios from "axios";
import { connectToTestDB, disconnectFromDB } from "../../../db";
import {
  decksTestCases,
  rawCardsTestData1,
  reversoTestLink,
  reversoTestResponse,
  yandexTestLink,
  yandexTestResponse,
} from "../../../test/testcases";
import { getBuffer } from "../../../utils";
import { cardsService } from "../../cards/cards.service";
import { UserJobsManager } from "../../schedule";
import { userService } from "../../users/users.service";
import { UserDTO } from "../../users/users.util";
import { decksService } from "../decks.service";
import { DynamicSyncType } from "../decks.util";
import { DeckModel } from "../models/decks.model";
import { IUserDeck } from "../models/userDecks.model";
import {
  filterByCustomId,
  ReversoFetcher,
  SyncClient,
  YandexFetcher,
} from "../sync";

describe("Sync client:filterByCustomId ", () => {
  let user: UserDTO;
  beforeAll(async () => {
    await connectToTestDB();
    user = await userService.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
  });

  const newRawCard = {
    frontPrimary: "hello",
    frontSecondary: "",
    backPrimary: "привет",
    backSecondary: "",
    customId: "3",
  };

  it("filterByCustomId, case 1", async () => {
    const dbDeck = await DeckModel.create({
      createdBy: user.id,
      author: user.name,
      name: String(Math.random()) + "-deck",
      totalCardsCount: 0,
    });
    const deck = await decksService.getDeckById(dbDeck.id);
    const cards = await cardsService.createCards(rawCardsTestData1, deck);
    expect(cards.length).toBe(rawCardsTestData1.length);

    const filtered1 = filterByCustomId(rawCardsTestData1, cards);
    expect(filtered1.length).toBe(0);

    const newRawCards = [...rawCardsTestData1, newRawCard];
    const filtered2 = filterByCustomId(newRawCards, cards);
    expect(filtered2.length).toBe(1);
    expect(filtered2).toContain(newRawCard);
    expect(filtered2).not.toContain(rawCardsTestData1);
  });
  it("filterByCustomId, case 2", () => {
    const newRawCards = [...rawCardsTestData1, newRawCard];
    const filtered = filterByCustomId(newRawCards, []);
    expect(filtered.length).toBe(3);
    expect(filtered).toEqual(newRawCards);
  });
  it("filterByCustomId, case 3", () => {
    const filtered = filterByCustomId([newRawCard], []);
    expect(filtered.length).toBe(1);
    expect(filtered).toContain(newRawCard);
  });
  it("filterByCustomId, case 4", () => {
    const newRawCard = {
      frontPrimary: "hello",
      frontSecondary: "",
      backPrimary: "привет",
      backSecondary: "",
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
  let user: UserDTO;
  let userDeck: IUserDeck;
  let dynUserDeck: IUserDeck;
  const tc = decksTestCases.case1;
  const buffer = getBuffer(tc.pathToFile);
  const type: DynamicSyncType = DynamicSyncType.reverso;
  const link = reversoTestLink;
  const syncClient = new SyncClient(type, link);

  beforeAll(async () => {
    await connectToTestDB();
  });

  beforeEach(async () => {
    user = await userService.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });

    const ud = await decksService.createUserDeck(user.id, {
      buffer,
      mimetype: "csv",
      originalname: "deck",
    });
    userDeck = { ...ud, deck: ud.deck.id } as unknown as IUserDeck;

    const dud = await decksService.createDynamicUserDeck(user.id);
    dynUserDeck = { ...dud, deck: dud.deck.id } as unknown as IUserDeck;
  });

  it("not dynamic user deck", async () => {
    let errMsg;
    try {
      await syncClient.syncHandler(userDeck);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Dynamic userDeck is required");
  });

  it("should call these functions", async () => {
    const spyGetCards = jest.spyOn(cardsService, "getCardsByDeckId");
    const spyCreateCards = jest.spyOn(cardsService, "createCards");
    await syncClient.syncHandler(dynUserDeck);
    expect(spyGetCards).toBeCalledWith(dynUserDeck.deck);
    expect(spyGetRawCards).toBeCalled();
    expect(spyCreateCards).toBeCalled();
  });

  it("ReversoFetcher: getRawCards", async () => {
    let reversoFetcher = new ReversoFetcher("");

    spyGetRawCards.mockRestore();
    let errMsg;
    try {
      await reversoFetcher.getRawCards();
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Link error");

    reversoFetcher = new ReversoFetcher(link);
    spyGetRawCards.mockRestore();

    jest.spyOn(axios, "get").mockImplementation(async () => null);
    try {
      await reversoFetcher.getRawCards();
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Reverso fetch data error");

    jest.spyOn(axios, "get").mockImplementation(async () => {
      return { data: { results: "something" } };
    });

    try {
      await reversoFetcher.getRawCards();
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Reverso results must be an array");

    const spyAxiosGet = jest
      .spyOn(axios, "get")
      .mockImplementation(async () => {
        return { data: reversoTestResponse };
      });
    const result = await reversoFetcher.getRawCards();
    expect(spyAxiosGet).toBeCalled();
    expect(result[0].customId).toBe(String(reversoTestResponse.results[0].id));
  });

  it("YandexFetcher: getRawCards", async () => {
    let yandexFetcher = new YandexFetcher("");

    spyGetRawCards.mockRestore();
    let errMsg;
    try {
      await yandexFetcher.getRawCards();
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Link error");

    yandexFetcher = new YandexFetcher(yandexTestLink);
    spyGetRawCards.mockRestore();

    jest.spyOn(axios, "get").mockImplementation(async () => null);
    try {
      await yandexFetcher.getRawCards();
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Sync error");

    jest.spyOn(axios, "get").mockImplementation(async () => {
      return {
        headers: { "set-cookie": ["test"] },
        data: { collection: { records: "something" } },
      };
    });

    try {
      await yandexFetcher.getRawCards();
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Fetch error");

    const spyAxiosGet = jest
      .spyOn(axios, "get")
      .mockImplementation(async () => {
        return {
          headers: { "set-cookie": ["test"] },
          data: yandexTestResponse,
        };
      });
    const result = await yandexFetcher.getRawCards();
    expect(spyAxiosGet).toBeCalled();
    expect(result[0].customId).toBe(
      yandexTestResponse.collection.records[0].id
    );
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});
