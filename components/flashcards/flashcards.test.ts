import { connectToTestDB, disconnectFromDB } from "../../db";
import { decksTestCases } from "../../test/testcases";
import * as utils from "../../utils";
import { getBuffer } from "../../utils";
import { userDecksManager } from "../decks/userDeck";
import { globalUserStore, User } from "../users/user";
import { CardsStore, globalCardsStore } from "./cards";
import { UserCardsClient, userCardsManager } from "./userCards";

const spyShuffle = jest.spyOn(utils, "shuffle");

const spyUserCardToDTO = jest.spyOn(
  UserCardsClient.prototype, // @ts-ignore
  "userCardToDTO"
);
const spyCardToDTO = jest.spyOn(
  CardsStore.prototype, // @ts-ignore
  "cardToDTO"
);
// ---get user cards---
const spyGetEmptyUserCards = jest.spyOn(
  UserCardsClient.prototype, // @ts-ignore
  "getEmptyUserCards"
);
const spyGetUserCardsFromDynamicUserDeck = jest.spyOn(
  UserCardsClient.prototype, // @ts-ignore
  "getUserCardsFromDynamicUserDeck"
);
const spyGetLearnedUserCards = jest.spyOn(
  UserCardsClient.prototype, // @ts-ignore
  "getLearnedUserCards"
);
const spyGetUserCardsFromSortedUserDecks = jest.spyOn(
  UserCardsClient.prototype, // @ts-ignore
  "getUserCardsFromSortedUserDecks"
);
const spyGetUserCardsFromUserDeck = jest.spyOn(
  UserCardsClient.prototype, // @ts-ignore
  "getUserCardsFromUserDeck"
);
// ---get cards---
const spyGetCardByCardId = jest.spyOn(CardsStore.prototype, "getCardByCardId");
const spyGetCardsByDeckId = jest.spyOn(
  CardsStore.prototype,
  "getCardsByDeckId"
);

describe("UserCardsClient", () => {
  let user: User;
  let ucclient: UserCardsClient;
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    user = await globalUserStore.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    ucclient = await userCardsManager.getUserCardsClient(user);
  });

  describe("getUserCards", () => {
    it("should be empty", async () => {
      const uc = await ucclient.getUserCards();
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetUserCardsFromDynamicUserDeck).toBeCalled();
      expect(spyGetLearnedUserCards).toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).not.toBeCalled();
      expect(uc.length).toBe(0);
    });
    it("getUserCardsFromSortedUserDecks + getEmptyUserCards", async () => {
      const udclient = await userDecksManager.getUserDecksClient(user);
      const tc = decksTestCases.case1;
      const file1 = {
        buffer: Buffer.from(""),
        mimetype: "csv",
        originalname: "userdeck1",
      };
      const file2 = {
        buffer: Buffer.from(""),
        mimetype: "csv",
        originalname: "userdeck2",
      };
      const file3 = {
        buffer: getBuffer(tc.pathToFile),
        mimetype: "csv",
        originalname: "userdeck3",
      };
      const userDeck1 = await udclient.createUserDeck(file1);
      const cards1 = globalCardsStore.getCardsByDeckId(userDeck1.deckId);
      expect(cards1.length).toBe(0);
      const userDeck2 = await udclient.createUserDeck(file2);
      const cards2 = globalCardsStore.getCardsByDeckId(userDeck2.deckId);
      expect(cards2.length).toBe(0);
      const userDeck3 = await udclient.createUserDeck(file3);
      const cards3 = globalCardsStore.getCardsByDeckId(userDeck3.deckId);
      expect(cards3.length).toBe(tc.cardsCount);

      // shuffle on
      await ucclient.updateShuffle(true);

      // disable user deck
      await udclient.enableUserDeck(userDeck3.id);
      let userCards = await ucclient.getUserCards();
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userDeck1);
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userDeck2);
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(userDeck3);
      expect(userCards.length).toBe(0);
      expect(spyShuffle).toBeCalledWith([userDeck1, userDeck2]);
      expect(spyShuffle).not.toBeCalledWith([userDeck1, userDeck2, userDeck3]);
      jest.clearAllMocks();

      // shuffle off
      await ucclient.updateShuffle(false);

      // enable user deck
      await udclient.enableUserDeck(userDeck3.id);
      userCards = await ucclient.getUserCards();
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).toBeCalledTimes(3);
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userDeck3);
      expect(spyShuffle).not.toBeCalledWith([userDeck1, userDeck2, userDeck3]);
      expect(userCards.length).toBe(tc.cardsCount);
      expect(spyUserCardToDTO).toBeCalledTimes(tc.cardsCount);
      const ids = userCards.map((uc) => uc.card.id).sort();
      expect(ids).toEqual(cards3.map((c) => c.id).sort());
      jest.clearAllMocks();

      // getEmptyUserCards
      userCards = await ucclient.getUserCards();
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
    });
  });

  describe("learnUserCard", () => {});
  describe("deleteUserCard", () => {});

  describe("favorites", () => {
    it("getFavorites", async () => {
      const uc = ucclient.getFavorites();
      expect(uc.length).toBe(0);
    });
    it("favoriteUserCard", async () => {
      expect(1).toBe(1);
    });
    // after deletion
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("filterByCardId", () => {});
describe("calcShowAfter", () => {});
describe("getIntervalArray", () => {});
describe("getStreak", () => {});
