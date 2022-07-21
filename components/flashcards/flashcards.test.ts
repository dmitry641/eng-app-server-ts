import { connectToTestDB, disconnectFromDB } from "../../db";
import {
  decksTestCases,
  reversoTestLink,
  testIntervalArray,
} from "../../test/testcases";
import * as utils from "../../utils";
import { getBuffer, sleep } from "../../utils";
import { ReversoFetcher } from "../decks/sync";
import { userDecksManager } from "../decks/userDeck";
import { globalJobStore } from "../schedule";
import { globalUserStore, User } from "../users/user";
import { DynamicSyncType, UserDeckPositionEnum } from "../users/users.util";
import { CardDTO, CardsStore, globalCardsStore } from "./cards";
import { CardInputOmit } from "./models/cards.model";
import { HistoryStatusEnum, HistoryType } from "./models/userCards.model";
import {
  calcShowAfter,
  CARDS_COUNT,
  filterByCardId,
  getIntervalArray,
  getStreak,
  UserCardDTO,
  UserCardsClient,
  userCardsManager,
} from "./userCards";

jest.mock("./const", () => {
  const originalModule = jest.requireActual("./const");

  return {
    __esModule: true,
    ...originalModule,
    intervalArray: testIntervalArray,
  };
});

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
    it("getUserCardsFromSortedUserDecks, case 1", async () => {
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

      expect(spyCardToDTO).toBeCalledTimes(tc.cardsCount * 2);

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
    it("getUserCardsFromSortedUserDecks, case 2", async () => {
      const udclient = await userDecksManager.getUserDecksClient(user);
      const tc = decksTestCases.case3;
      const file1 = {
        buffer: getBuffer(tc.pathToFile),
        mimetype: "csv",
        originalname: "userdeck1",
      };
      const file2 = {
        buffer: getBuffer(tc.pathToFile),
        mimetype: "csv",
        originalname: "userdeck2",
      };
      const userDeck1 = await udclient.createUserDeck(file1);
      const cards1 = globalCardsStore.getCardsByDeckId(userDeck1.deckId);
      const userDeck2 = await udclient.createUserDeck(file2);
      const cards2 = globalCardsStore.getCardsByDeckId(userDeck2.deckId);
      const cards1Ids = cards1.map((c) => c.id);
      const cards2Ids = cards2.map((c) => c.id);
      expect(cards1.length).toBe(tc.cardsCount);
      expect(cards2.length).toBe(tc.cardsCount);

      let userCards = await ucclient.getUserCards();
      expect(userCards.length).toBe(CARDS_COUNT);
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userDeck1);
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(userDeck2);
      let ucIds = userCards.map((uc) => uc.cardId);
      for (const ucId of ucIds) {
        expect(cards1Ids).toContainEqual(ucId);
        expect(cards2Ids).not.toContainEqual(ucId);
      }
      jest.clearAllMocks();

      // getEmptyUserCards
      userCards = await ucclient.getUserCards();
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
      jest.clearAllMocks();

      // delete user cards
      for (const uc of userCards) {
        await ucclient.deleteUserCard(uc.id);
      }

      // move user deck
      await udclient.moveUserDeck(userDeck1.id, UserDeckPositionEnum.down);
      const ud1 = udclient.getUserDeckById(userDeck1.id);
      const ud2 = udclient.getUserDeckById(userDeck2.id);

      userCards = await ucclient.getUserCards();
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(ud1);
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(ud2);
      ucIds = userCards.map((uc) => uc.cardId);
      for (const ucId of ucIds) {
        expect(cards1Ids).not.toContainEqual(ucId);
        expect(cards2Ids).toContainEqual(ucId);
      }
      jest.clearAllMocks();

      // getEmptyUserCards
      userCards = await ucclient.getUserCards();
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
      jest.clearAllMocks();

      // delete user cards
      for (const uc of userCards) {
        await ucclient.deleteUserCard(uc.id);
      }

      // delete user decks
      await udclient.deleteUserDeck(ud1.id);
      await udclient.deleteUserDeck(ud2.id);
      userCards = await ucclient.getUserCards();
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(ud1);
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(ud2);
      expect(userCards.length).toBe(0);
    });
    it("getUserCardsFromDynamicUserDeck", async () => {
      jest.spyOn(globalJobStore.userJobs, "updateJob").mockReturnValue();
      const udclient = await userDecksManager.getUserDecksClient(user);
      const dynUserDeck = await udclient.createDynamicUserDeck();
      await udclient.updateSyncData(DynamicSyncType.reverso, reversoTestLink);

      // high priority false
      await ucclient.updateHighPriority(false);
      let userCards = await ucclient.getUserCards();
      expect(spyGetUserCardsFromDynamicUserDeck).not.toBeCalled();
      expect(spyGetLearnedUserCards).toBeCalled();

      // high priority true
      await ucclient.updateHighPriority(true);
      userCards = await ucclient.getUserCards();
      expect(spyGetUserCardsFromDynamicUserDeck).toBeCalled();
      expect(spyGetLearnedUserCards).toBeCalled();
      expect(userCards.length).toBe(0);
      jest.clearAllMocks();

      // sync dynamic user deck
      const newCard: CardInputOmit = {
        frontPrimary: "q",
        frontSecondary: "w",
        backPrimary: "e",
        backSecondary: "r",
        customId: "t",
      };
      jest
        .spyOn(ReversoFetcher.prototype, "getRawCards")
        .mockImplementation(async () => [newCard]);

      await udclient.syncDynamicUserDeck();

      userCards = await ucclient.getUserCards();
      expect(spyGetUserCardsFromDynamicUserDeck).toBeCalled();
      expect(spyGetLearnedUserCards).not.toBeCalled();
      expect(userCards.length).toBe(1);
      jest.clearAllMocks();

      // getEmptyUserCards
      userCards = await ucclient.getUserCards();
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetUserCardsFromDynamicUserDeck).not.toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
    });
  });

  it("learnUserCard + getLearnedUserCards", async () => {
    const udclient = await userDecksManager.getUserDecksClient(user);
    const tc = decksTestCases.case1;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    await udclient.createUserDeck(file);

    let userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(tc.cardsCount);
    jest.clearAllMocks();

    const uc1 = Object.assign({}, userCards[0]);
    let luc1 = await ucclient.learnUserCard(uc1.id, HistoryStatusEnum.medium);
    expect(luc1.history.length).toBe(1);
    expect(luc1.history[0].status).toBe(HistoryStatusEnum.medium);

    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(tc.cardsCount - 1);
    expect(userCards.map((uc) => uc.id)).not.toContain(uc1.id);
    expect(spyGetLearnedUserCards).not.toBeCalled();

    let errMsg;
    try {
      await ucclient.learnUserCard(uc1.id, HistoryStatusEnum.medium);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("This userCard cannot be learned now");

    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(tc.cardsCount - 1);
    expect(userCards.map((uc) => uc.id)).not.toContain(uc1.id);
    expect(spyGetLearnedUserCards).not.toBeCalled();

    for (const uc of userCards) {
      await ucclient.learnUserCard(uc.id, HistoryStatusEnum.easy);
    }

    await sleep(testIntervalArray.mediumArray[0]);

    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(1);
    expect(userCards.map((uc) => uc.id)).toContain(uc1.id);
    expect(spyGetLearnedUserCards).toBeCalled();

    // learn the same user card again
    luc1 = await ucclient.learnUserCard(uc1.id, HistoryStatusEnum.medium);
    expect(luc1.history.length).toBe(2);

    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(0);

    await sleep(testIntervalArray.mediumArray[1]);
    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(1);
  });

  it("getUserCards: showLearned", async () => {
    const udclient = await userDecksManager.getUserDecksClient(user);
    const tc4 = decksTestCases.case4;
    const file1 = {
      buffer: getBuffer(tc4.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    const userDeck1 = await udclient.createUserDeck(file1);

    let userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(tc4.cardsCount);

    let counter = 0;
    for (const uc of userCards) {
      await ucclient.learnUserCard(uc.id, HistoryStatusEnum.hard);
      counter++;
    }
    await sleep(testIntervalArray.hardArray[0]);

    let settings = ucclient.getUserCardsSettings();
    expect(settings.showLearned).toBe(true);

    jest.clearAllMocks();
    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(counter);
    expect(spyGetLearnedUserCards).toBeCalled();
    expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();

    await ucclient.updateShowLearned(false);
    settings = ucclient.getUserCardsSettings();
    expect(settings.showLearned).toBe(false);

    jest.clearAllMocks();
    userCards = await ucclient.getUserCards();
    expect(spyGetLearnedUserCards).not.toBeCalled();
    expect(userCards.length).toBe(0);

    const tc5 = decksTestCases.case5;
    const file2 = {
      buffer: getBuffer(tc5.pathToFile),
      mimetype: "csv",
      originalname: "userdeck2",
    };
    const userDeck2 = await udclient.createUserDeck(file2);
    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(tc5.cardsCount);

    for (const uc of userCards) {
      await ucclient.deleteUserCard(uc.id);
    }

    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(0);

    await ucclient.updateShowLearned(true);
    settings = ucclient.getUserCardsSettings();
    expect(settings.showLearned).toBe(true);

    jest.clearAllMocks();
    userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(counter);
    expect(spyGetLearnedUserCards).toBeCalled();
    expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
  });

  it("deleteUserCard, case 1", async () => {
    const udclient = await userDecksManager.getUserDecksClient(user);
    const tc = decksTestCases.case1;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    const userDeck = await udclient.createUserDeck(file);
    const cards = globalCardsStore.getCardsByDeckId(userDeck.deckId);
    expect(cards.length).toBe(tc.cardsCount);
    const cardIds = cards.map((c) => c.id);

    let userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(userDeck.cardsCount);

    for (const _ of [1, 2, 3]) {
      let userCards = await ucclient.getUserCards();
      expect(userCards.length).toBe(cards.length);
      const ucCardIds = userCards.map((uc) => uc.cardId);
      for (const ucCardId of ucCardIds) {
        expect(cardIds).toContain(ucCardId);
      }
    }

    const uc1 = Object.assign({}, userCards[0]);
    await ucclient.deleteUserCard(uc1.id);

    const updatedUD = udclient.getUserDeckById(userDeck.id);
    expect(updatedUD.cardsCount).toBe(userDeck.cardsCount - 1);

    for (const _ of [1, 2, 3]) {
      let userCards = await ucclient.getUserCards();
      expect(userCards.length).toBe(cards.length - 1);
      expect(userCards.map((uc) => uc.id)).not.toContain(uc1.id);
    }

    let errMsg;
    try {
      await ucclient.deleteUserCard(uc1.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("UserCard is already deleted");
  });

  it("deleteUserCard, case 2", async () => {
    const user = await globalUserStore.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    const ucclient = await userCardsManager.getUserCardsClient(user);
    const udclient = await userDecksManager.getUserDecksClient(user);
    const tc = decksTestCases.case1;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    const userDeck = await udclient.createUserDeck(file);
    const cards = globalCardsStore.getCardsByDeckId(userDeck.deckId);
    expect(cards.length).toBe(10);

    const userCards1 = await ucclient.getUserCards();
    expect(userCards1.length).toBe(10);
    const cardIds = cards.map((c) => c.id).sort();
    const uCardIds1 = userCards1.map((uc) => uc.cardId).sort();
    const uCardIds2 = userCards1.map((uc) => uc.card.id).sort();
    expect(cardIds).toEqual(uCardIds1);
    expect(cardIds).toEqual(uCardIds2);
    expect(uCardIds1).toEqual(uCardIds2);

    const IDS_1 = userCards1.map((uc) => uc.id).sort();
    const half = Math.ceil(IDS_1.length / 2);
    const firstHalf = IDS_1.splice(0, half);
    const secondHalf = IDS_1.splice(-half);

    for (const id of firstHalf) {
      await ucclient.deleteUserCard(id);
    }
    const userCards2 = await ucclient.getUserCards();
    expect(userCards2.length).toBe(5);
    const IDS_2 = userCards2.map((uc) => uc.id).sort();
    expect(IDS_2).toEqual(secondHalf);

    const uc1 = String(userCards2[0].id);
    await ucclient.learnUserCard(uc1, HistoryStatusEnum.medium);

    const userCards3 = await ucclient.getUserCards();
    expect(userCards3.length).toBe(4);
    for (const uc of userCards3) {
      await ucclient.learnUserCard(uc.id, HistoryStatusEnum.easy);
    }

    const userCards4 = await ucclient.getUserCards();
    expect(userCards4.length).toBe(0);

    await sleep(testIntervalArray.mediumArray[0]);

    const userCards5 = await ucclient.getUserCards();
    expect(userCards5.length).toBe(1);
    expect(userCards5[0].id).toBe(uc1);

    await ucclient.deleteUserCard(uc1);
    const userCards6 = await ucclient.getUserCards();
    expect(userCards6.length).toBe(0);

    await sleep(testIntervalArray.easyArray[0]);
    const userCards7 = await ucclient.getUserCards();
    expect(userCards7.length).toBe(4);

    for (const uc of userCards7) {
      await ucclient.deleteUserCard(uc.id);
    }

    const userCards8 = await ucclient.getUserCards();
    expect(userCards8.length).toBe(0);
  });

  it("favorites", async () => {
    const udclient = await userDecksManager.getUserDecksClient(user);
    const tc = decksTestCases.case1;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    await udclient.createUserDeck(file);

    let favorites = ucclient.getFavorites();
    expect(favorites.length).toBe(0);

    let userCards = await ucclient.getUserCards();
    expect(userCards.length).toBe(tc.cardsCount);

    const uc1 = Object.assign({}, userCards[0]);

    // favorite
    await ucclient.favoriteUserCard(uc1.id);
    favorites = ucclient.getFavorites();
    expect(favorites.length).toBe(1);
    expect(favorites.map((f) => f.id)).toContain(uc1.id);

    // unfavorite
    await ucclient.favoriteUserCard(uc1.id);
    favorites = ucclient.getFavorites();
    expect(favorites.length).toBe(0);
    expect(favorites.map((f) => f.id)).not.toContain(uc1.id);

    // after deletion
    await ucclient.favoriteUserCard(uc1.id);
    favorites = ucclient.getFavorites();
    expect(favorites.length).toBe(1);

    await ucclient.deleteUserCard(uc1.id);
    favorites = ucclient.getFavorites();
    expect(favorites.length).toBe(0);
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("filterByCardId", () => {
  it("should be empty", () => {
    const cards1 = [] as CardDTO[];
    const userCards1 = [] as UserCardDTO[];
    const filtered1 = filterByCardId(cards1, userCards1);
    expect(filtered1.length).toBe(0);

    const cards2 = [{ id: "1" }] as CardDTO[];
    const userCards2 = [{ cardId: "1" }] as UserCardDTO[];
    const filtered2 = filterByCardId(cards2, userCards2);
    expect(filtered2.length).toBe(0);

    const cards3 = [{ id: "1" }, { id: "3" }, { id: "2" }] as CardDTO[];
    const userCards3 = [
      { cardId: "3" },
      { cardId: "1" },
      { cardId: "2" },
    ] as UserCardDTO[];
    const filtered3 = filterByCardId(cards3, userCards3);
    expect(filtered3.length).toBe(0);
  });
  it("should not be empty", () => {
    const cards1 = [{ id: "1" }] as CardDTO[];
    const userCards1 = [] as UserCardDTO[];
    const filtered1 = filterByCardId(cards1, userCards1);
    expect(filtered1.length).toBe(1);

    const cards2 = [{ id: "1" }, { id: "2" }, { id: "3" }] as CardDTO[];
    const userCards2 = [{ cardId: "1" }] as UserCardDTO[];
    const filtered2 = filterByCardId(cards2, userCards2);
    expect(filtered2.length).toBe(2);

    const cards3 = [
      { id: "1" },
      { id: "2" },
      { id: "3" },
      { id: "4" },
    ] as CardDTO[];
    const userCards3 = [
      { cardId: "4" },
      { cardId: "5" },
      { cardId: "6" },
      { cardId: "7" },
    ] as UserCardDTO[];
    const filtered3 = filterByCardId(cards3, userCards3);
    expect(filtered3.length).toBe(3);
  });
});

describe("calcShowAfter", () => {
  const precision = -1;
  const TIA = testIntervalArray;
  it("streak 0", () => {
    const dateNow = Date.now();
    const hardResult1 = calcShowAfter(HistoryStatusEnum.hard, []);
    expect(hardResult1).toBeCloseTo(dateNow + TIA.hardArray[0], precision);
    const hardResult2 = calcShowAfter(HistoryStatusEnum.hard, [
      { date: 1, status: HistoryStatusEnum.easy },
    ]);
    expect(hardResult2).toBeCloseTo(dateNow + TIA.hardArray[0], precision);

    const mediumResult1 = calcShowAfter(HistoryStatusEnum.medium, []);
    expect(mediumResult1).toBeCloseTo(dateNow + TIA.mediumArray[0], precision);
    const mediumResult2 = calcShowAfter(HistoryStatusEnum.medium, [
      { date: 1, status: HistoryStatusEnum.medium },
      { date: 2, status: HistoryStatusEnum.hard },
    ]);
    expect(mediumResult2).toBeCloseTo(dateNow + TIA.mediumArray[0], precision);

    const easyResult1 = calcShowAfter(HistoryStatusEnum.easy, []);
    expect(easyResult1).toBeCloseTo(dateNow + TIA.easyArray[0], precision);
    const easyResult2 = calcShowAfter(HistoryStatusEnum.easy, [
      { date: 1, status: HistoryStatusEnum.easy },
      { date: 2, status: HistoryStatusEnum.easy },
      { date: 3, status: HistoryStatusEnum.medium },
    ]);
    expect(easyResult2).toBeCloseTo(dateNow + TIA.easyArray[0], precision);
  });
  it("streak 1", () => {
    const dateNow = Date.now();
    const hardResult = calcShowAfter(HistoryStatusEnum.hard, [
      { date: 1, status: HistoryStatusEnum.hard },
    ]);
    expect(hardResult).toBeCloseTo(dateNow + TIA.hardArray[0], precision); // out of bounds
    // кривовато сделано, можно было лучше: в цикле, hardArray.at(-1) и тд

    const mediumResult = calcShowAfter(HistoryStatusEnum.medium, [
      { date: 1, status: HistoryStatusEnum.hard },
      { date: 2, status: HistoryStatusEnum.medium },
    ]);
    expect(mediumResult).toBeCloseTo(dateNow + TIA.mediumArray[1], precision);

    const easyResult = calcShowAfter(HistoryStatusEnum.easy, [
      { date: 1, status: HistoryStatusEnum.easy },
      { date: 2, status: HistoryStatusEnum.medium },
      { date: 3, status: HistoryStatusEnum.easy },
    ]);
    expect(easyResult).toBeCloseTo(dateNow + TIA.easyArray[1], precision);
  });
  it("streak 2", () => {
    const dateNow = Date.now();
    const hardResult = calcShowAfter(HistoryStatusEnum.hard, [
      { date: 1, status: HistoryStatusEnum.hard },
      { date: 2, status: HistoryStatusEnum.hard },
    ]);
    expect(hardResult).toBeCloseTo(dateNow + TIA.hardArray[0], precision); // out of bounds

    const mediumResult = calcShowAfter(HistoryStatusEnum.medium, [
      { date: 1, status: HistoryStatusEnum.medium },
      { date: 2, status: HistoryStatusEnum.medium },
    ]);
    expect(mediumResult).toBeCloseTo(dateNow + TIA.mediumArray[1], precision); // out of bounds

    const easyResult = calcShowAfter(HistoryStatusEnum.easy, [
      { date: 1, status: HistoryStatusEnum.medium },
      { date: 2, status: HistoryStatusEnum.easy },
      { date: 3, status: HistoryStatusEnum.easy },
    ]);
    expect(easyResult).toBeCloseTo(dateNow + TIA.easyArray[2], precision);
  });
  it("streak 3", () => {
    const dateNow = Date.now();
    const hardResult = calcShowAfter(HistoryStatusEnum.hard, [
      { date: 1, status: HistoryStatusEnum.hard },
      { date: 2, status: HistoryStatusEnum.hard },
      { date: 3, status: HistoryStatusEnum.hard },
    ]);
    expect(hardResult).toBeCloseTo(dateNow + TIA.hardArray[0], precision); // out of bounds

    const mediumResult = calcShowAfter(HistoryStatusEnum.medium, [
      { date: 1, status: HistoryStatusEnum.medium },
      { date: 2, status: HistoryStatusEnum.medium },
      { date: 3, status: HistoryStatusEnum.medium },
    ]);
    expect(mediumResult).toBeCloseTo(dateNow + TIA.mediumArray[1], precision); // out of bounds

    const easyResult = calcShowAfter(HistoryStatusEnum.easy, [
      { date: 1, status: HistoryStatusEnum.easy },
      { date: 2, status: HistoryStatusEnum.medium },
      { date: 3, status: HistoryStatusEnum.easy },
      { date: 4, status: HistoryStatusEnum.easy },
      { date: 5, status: HistoryStatusEnum.easy },
    ]);
    expect(easyResult).toBeCloseTo(dateNow + TIA.easyArray[3], precision);
  });
});

describe("getIntervalArray", () => {
  it("hard", () => {
    const arr = getIntervalArray(HistoryStatusEnum.hard);
    expect(arr).toEqual(testIntervalArray.hardArray);
  });
  it("medium", () => {
    const arr = getIntervalArray(HistoryStatusEnum.medium);
    expect(arr).toEqual(testIntervalArray.mediumArray);
  });
  it("easy", () => {
    const arr = getIntervalArray(HistoryStatusEnum.easy);
    expect(arr).toEqual(testIntervalArray.easyArray);
  });
});

describe("getStreak", () => {
  const arr: HistoryType[] = [
    { date: 1, status: HistoryStatusEnum.easy },
    { date: 2, status: HistoryStatusEnum.easy },
    { date: 3, status: HistoryStatusEnum.easy },
    { date: 4, status: HistoryStatusEnum.easy },
    { date: 5, status: HistoryStatusEnum.easy },
    { date: 6, status: HistoryStatusEnum.medium },
  ];
  const arr0: HistoryType[] = [{ date: 1, status: HistoryStatusEnum.medium }];
  const arr1: HistoryType[] = [
    { date: 1, status: HistoryStatusEnum.easy },
    { date: 2, status: HistoryStatusEnum.easy },
    { date: 3, status: HistoryStatusEnum.easy },
  ];
  const arr2: HistoryType[] = [
    { date: 1, status: HistoryStatusEnum.easy },
    { date: 2, status: HistoryStatusEnum.medium },
    { date: 3, status: HistoryStatusEnum.easy },
    { date: 4, status: HistoryStatusEnum.easy },
  ];
  const arr3: HistoryType[] = [
    { date: 1, status: HistoryStatusEnum.easy },
    { date: 2, status: HistoryStatusEnum.easy },
    { date: 3, status: HistoryStatusEnum.medium },
    { date: 4, status: HistoryStatusEnum.hard },
    { date: 5, status: HistoryStatusEnum.easy },
  ];
  const arr4: HistoryType[] = [{ date: 1, status: HistoryStatusEnum.easy }];
  it("should not mutate array", () => {
    const before = Array.from(arr1);
    const streak = getStreak(HistoryStatusEnum.easy, arr1);
    const after = Array.from(arr1);
    expect(before).toEqual(after);
  });
  it("should return 0", () => {
    const streak1 = getStreak(HistoryStatusEnum.easy, []);
    expect(streak1).toBe(0);
    const streak2 = getStreak(HistoryStatusEnum.easy, arr);
    expect(streak2).toBe(0);
    const streak3 = getStreak(HistoryStatusEnum.easy, arr0);
    expect(streak3).toBe(0);
  });
  it("should return 3", () => {
    const streak = getStreak(HistoryStatusEnum.easy, arr1);
    expect(streak).toBe(3);
  });
  it("should return 2", () => {
    const streak = getStreak(HistoryStatusEnum.easy, arr2);
    expect(streak).toBe(2);
  });
  it("should return 1", () => {
    const streak1 = getStreak(HistoryStatusEnum.easy, arr3);
    expect(streak1).toBe(1);
    const streak2 = getStreak(HistoryStatusEnum.easy, arr4);
    expect(streak2).toBe(1);
  });
});
