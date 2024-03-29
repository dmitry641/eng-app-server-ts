import { connectToTestDB, disconnectFromDB } from "../../db";
import { decksTestCases, testHour } from "../../test/testcases";
import * as utils from "../../utils";
import { getBuffer } from "../../utils";
import { decksService } from "../decks/decks.service";
import { UDPositionEnum } from "../decks/decks.util";
import { userService } from "../users/users.service";
import { CardsService, cardsService, intervalArray } from "./cards.service";
import { CARDS_COUNT, UpdateTypeEnum, filterByCardId } from "./cards.util";
import { ICard } from "./models/cards.model";
import { IUserCard } from "./models/userCards.model";

jest.mock("./cards.util", () => {
  const originalModule = jest.requireActual("./cards.util");

  return {
    __esModule: true,
    ...originalModule,
    HOUR: testHour,
  };
});

const spyShuffle = jest.spyOn(utils, "shuffle");

const spyUserCardToDTO = jest.spyOn(
  CardsService.prototype, // @ts-ignore
  "userCardToDTO"
);
const spyCardToDTO = jest.spyOn(
  CardsService.prototype, // @ts-ignore
  "cardToDTO"
);
const spyGetEmptyUserCards = jest.spyOn(
  CardsService.prototype, // @ts-ignore
  "getEmptyUserCards"
);
const spyGetLearnedUserCards = jest.spyOn(
  CardsService.prototype, // @ts-ignore
  "getLearnedUserCards"
);
const spyGetUserCardsFromSortedUserDecks = jest.spyOn(
  CardsService.prototype, // @ts-ignore
  "getUserCardsFromSortedUserDecks"
);
const spyGetUserCardsFromUserDeck = jest.spyOn(
  CardsService.prototype, // @ts-ignore
  "getUserCardsFromUserDeck"
);

describe("CardsService", () => {
  let userId: string;
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    const user = await userService.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    userId = user.id;
  });

  describe("getUserCards", () => {
    it("should be empty", async () => {
      const uc = await cardsService.getUserCards(userId);
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetLearnedUserCards).toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).not.toBeCalled();
      expect(uc.length).toBe(0);
    });

    it("getUserCardsFromSortedUserDecks, case 1", async () => {
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
      const userDeck1 = await decksService.createUserDeck(userId, file1);
      const cards1 = await cardsService.getCardsByDeckId(userDeck1.deck.id);
      expect(cards1.length).toBe(0);
      const userDeck2 = await decksService.createUserDeck(userId, file2);
      const cards2 = await cardsService.getCardsByDeckId(userDeck2.deck.id);
      expect(cards2.length).toBe(0);
      const userDeck3 = await decksService.createUserDeck(userId, file3);
      const cards3 = await cardsService.getCardsByDeckId(userDeck3.deck.id);
      expect(cards3.length).toBe(tc.cardsCount);

      expect(spyCardToDTO).toBeCalledTimes(tc.cardsCount * 2);

      // shuffle on
      await cardsService.updateSettings(userId, {
        type: UpdateTypeEnum.shuffleDecks,
        value: true,
      });

      // disable user deck
      await decksService.enableUserDeck(userId, userDeck3.id);
      let userCards = await cardsService.getUserCards(userId);
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userId, userDeck1);
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userId, userDeck2);
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(userId, userDeck3);
      expect(userCards.length).toBe(0);
      expect(spyShuffle).toBeCalledWith([userDeck1, userDeck2]);
      expect(spyShuffle).not.toBeCalledWith([userDeck1, userDeck2, userDeck3]);
      jest.clearAllMocks();

      // shuffle off
      await cardsService.updateSettings(userId, {
        type: UpdateTypeEnum.shuffleDecks,
        value: false,
      });

      // enable user deck
      await decksService.enableUserDeck(userId, userDeck3.id);
      userCards = await cardsService.getUserCards(userId);
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).toBeCalledTimes(3);
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userId, userDeck3);
      expect(spyShuffle).not.toBeCalledWith([userDeck1, userDeck2, userDeck3]);
      expect(userCards.length).toBe(tc.cardsCount);
      expect(spyUserCardToDTO).toBeCalledTimes(1);
      const ids = userCards.map((uc) => uc.card.id).sort();
      expect(ids).toEqual(cards3.map((c) => c.id).sort());
      jest.clearAllMocks();

      // getEmptyUserCards
      userCards = await cardsService.getUserCards(userId);
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
    });

    it("getUserCardsFromSortedUserDecks, case 2", async () => {
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
      const userDeck1 = await decksService.createUserDeck(userId, file1);
      const cards1 = await cardsService.getCardsByDeckId(userDeck1.deck.id);
      const userDeck2 = await decksService.createUserDeck(userId, file2);
      const cards2 = await cardsService.getCardsByDeckId(userDeck2.deck.id);
      const cards1Ids = cards1.map((c) => c.id);
      const cards2Ids = cards2.map((c) => c.id);
      expect(cards1.length).toBe(tc.cardsCount);
      expect(cards2.length).toBe(tc.cardsCount);

      let userCards = await cardsService.getUserCards(userId);
      expect(userCards.length).toBe(CARDS_COUNT);
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userId, userDeck1);
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(userId, userDeck2);
      let ucIds = userCards.map((uc) => uc.card.id);
      for (const ucId of ucIds) {
        expect(cards1Ids).toContainEqual(ucId);
        expect(cards2Ids).not.toContainEqual(ucId);
      }
      jest.clearAllMocks();

      // getEmptyUserCards
      userCards = await cardsService.getUserCards(userId);
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
      jest.clearAllMocks();

      // delete user cards
      for (const uc of userCards) {
        await cardsService.deleteUserCard(userId, uc.id);
      }

      // move user deck
      await decksService.moveUserDeck(
        userId,
        userDeck1.id,
        UDPositionEnum.down
      );
      const userDecks = await decksService.getUserDecks(userId);
      const ud1 = userDecks.find((el) => el.id === userDeck1.id);
      const ud2 = userDecks.find((el) => el.id === userDeck2.id);
      if (!ud1 || !ud2) throw new Error("userdeck not found");

      userCards = await cardsService.getUserCards(userId);
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(userId, ud1);
      expect(spyGetUserCardsFromUserDeck).toBeCalledWith(userId, ud2);
      ucIds = userCards.map((uc) => uc.card.id);
      for (const ucId of ucIds) {
        expect(cards1Ids).not.toContainEqual(ucId);
        expect(cards2Ids).toContainEqual(ucId);
      }
      jest.clearAllMocks();

      // getEmptyUserCards
      userCards = await cardsService.getUserCards(userId);
      expect(spyGetEmptyUserCards).toBeCalled();
      expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
      jest.clearAllMocks();

      // delete user cards
      for (const uc of userCards) {
        await cardsService.deleteUserCard(userId, uc.id);
      }

      // delete user decks
      await decksService.deleteUserDeck(userId, ud1.id);
      await decksService.deleteUserDeck(userId, ud2.id);
      userCards = await cardsService.getUserCards(userId);
      expect(spyGetUserCardsFromSortedUserDecks).toBeCalled();
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(userId, ud1);
      expect(spyGetUserCardsFromUserDeck).not.toBeCalledWith(userId, ud2);
      expect(userCards.length).toBe(0);
    });
  });

  it("learnUserCard + getLearnedUserCards", async () => {
    const tc = decksTestCases.case1;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    await decksService.createUserDeck(userId, file);

    let userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(tc.cardsCount);
    jest.clearAllMocks();

    const uc1 = Object.assign({}, userCards[0]);
    const dateBefore = Date.now();
    let { userCard: luc1 } = await cardsService.learnUserCard(
      userId,
      uc1.id,
      true
    );
    expect(luc1.streak).toBe(1);
    const diff = luc1.showAfter - (dateBefore + intervalArray[luc1.streak]);
    expect(diff).toBeLessThanOrEqual(5);

    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(tc.cardsCount - 1);
    expect(userCards.map((uc) => uc.id)).not.toContain(uc1.id);
    expect(spyGetLearnedUserCards).not.toBeCalled();

    let errMsg;
    try {
      await cardsService.learnUserCard(userId, uc1.id, true);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("This userCard cannot be learned now");

    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(tc.cardsCount - 1);
    expect(userCards.map((uc) => uc.id)).not.toContain(uc1.id);
    expect(spyGetLearnedUserCards).not.toBeCalled();

    await utils.sleep(intervalArray[1]);
    for (const uc of userCards) {
      await cardsService.learnUserCard(userId, uc.id, true);
    }

    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(1);
    expect(userCards.map((uc) => uc.id)).toContain(uc1.id);
    expect(spyGetLearnedUserCards).toBeCalled();

    const dateBefore2 = Date.now();
    // unlearn the first user card
    let object = await cardsService.learnUserCard(userId, uc1.id, false);
    luc1 = object.userCard;
    expect(luc1.streak).toBe(1);
    const diff2 = luc1.showAfter - (dateBefore2 + intervalArray[luc1.streak]);
    expect(diff2).toBeLessThanOrEqual(5);

    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(0);

    await utils.sleep(intervalArray[0]);
    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(1);
    expect(userCards[0].id).toBe(luc1.id);
  });

  it("learn/delete userCard + delete user deck", async () => {
    const tc = decksTestCases.case2;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    const ud = await decksService.createUserDeck(userId, file);

    let ucs = await cardsService.getUserCards(userId);
    expect(ucs.length).toBe(7);
    await cardsService.learnUserCard(userId, ucs[0].id, true);
    const obj = await cardsService.deleteUserCard(userId, ucs[1].id);

    let uds = await decksService.getUserDecks(userId);
    expect(uds.length).toBe(1);
    const ud0 = uds[0];
    expect(ud0).toEqual(obj.userDeck);
    expect(ud0.cardsLearned).toBe(ud.cardsLearned + 1);
    expect(ud0.cardsCount).toBe(ud.cardsCount - 1);

    await decksService.deleteUserDeck(userId, ud.id);
    const obj1 = await cardsService.learnUserCard(userId, ucs[2].id, true);
    const obj2 = await cardsService.deleteUserCard(userId, ucs[3].id);
    expect(obj1.userDeck).toBeUndefined();
    expect(obj2.userDeck).toBeUndefined();

    ucs = await cardsService.getUserCards(userId);
    expect(ucs.length).toBe(3);
  });

  it("getUserCards: showLearned", async () => {
    const tc4 = decksTestCases.case4;
    const file1 = {
      buffer: getBuffer(tc4.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    const userDeck1 = await decksService.createUserDeck(userId, file1);

    let userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(tc4.cardsCount);

    let counter = 0;
    for (const uc of userCards) {
      await cardsService.learnUserCard(userId, uc.id, true);
      counter++;
    }
    await utils.sleep(intervalArray[1]);

    let settings = await cardsService.getCardsSettings(userId);
    expect(settings.showLearned).toBe(true);

    jest.clearAllMocks();
    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(counter);
    expect(spyGetLearnedUserCards).toBeCalled();
    expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();

    await cardsService.updateSettings(userId, {
      type: UpdateTypeEnum.showLearned,
      value: false,
    });
    settings = await cardsService.getCardsSettings(userId);
    expect(settings.showLearned).toBe(false);

    jest.clearAllMocks();
    userCards = await cardsService.getUserCards(userId);
    expect(spyGetLearnedUserCards).not.toBeCalled();
    expect(userCards.length).toBe(0);

    const tc5 = decksTestCases.case5;
    const file2 = {
      buffer: getBuffer(tc5.pathToFile),
      mimetype: "csv",
      originalname: "userdeck2",
    };
    const userDeck2 = await decksService.createUserDeck(userId, file2);
    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(tc5.cardsCount);

    for (const uc of userCards) {
      await cardsService.deleteUserCard(userId, uc.id);
    }

    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(0);

    await cardsService.updateSettings(userId, {
      type: UpdateTypeEnum.showLearned,
      value: true,
    });
    settings = await cardsService.getCardsSettings(userId);
    expect(settings.showLearned).toBe(true);

    jest.clearAllMocks();
    userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(counter);
    expect(spyGetLearnedUserCards).toBeCalled();
    expect(spyGetUserCardsFromSortedUserDecks).not.toBeCalled();
  });

  it("deleteUserCard, case 1", async () => {
    const tc = decksTestCases.case1;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    const userDeck = await decksService.createUserDeck(userId, file);
    const cards = await cardsService.getCardsByDeckId(userDeck.deck.id);
    expect(cards.length).toBe(tc.cardsCount);
    const cardIds = cards.map((c) => c.id);

    let userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(userDeck.cardsCount);

    for (const _ of [1, 2, 3]) {
      let userCards = await cardsService.getUserCards(userId);
      expect(userCards.length).toBe(cards.length);
      const ucCardIds = userCards.map((uc) => uc.card.id);
      for (const ucCardId of ucCardIds) {
        expect(cardIds).toContain(ucCardId);
      }
    }

    const uc1 = Object.assign({}, userCards[0]);
    await cardsService.deleteUserCard(userId, uc1.id);

    const userDecks = await decksService.getUserDecks(userId);
    const updatedUD = userDecks.find((el) => el.id === userDeck.id);
    if (!updatedUD) throw new Error("userdeck not found");
    expect(updatedUD.cardsCount).toBe(userDeck.cardsCount - 1);

    for (const _ of [1, 2, 3]) {
      let userCards = await cardsService.getUserCards(userId);
      expect(userCards.length).toBe(cards.length - 1);
      expect(userCards.map((uc) => uc.id)).not.toContain(uc1.id);
    }

    let errMsg;
    try {
      await cardsService.deleteUserCard(userId, uc1.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("UserCard doesn't exist");
  });

  it("deleteUserCard, case 2", async () => {
    let userId: string;
    const other_user = await userService.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    userId = other_user.id;

    const tc = decksTestCases.case1;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    const userDeck = await decksService.createUserDeck(userId, file);
    const cards = await cardsService.getCardsByDeckId(userDeck.deck.id);
    expect(cards.length).toBe(10);

    const userCards1 = await cardsService.getUserCards(userId);
    expect(userCards1.length).toBe(10);
    const cardIds = cards.map((c) => c.id).sort();
    const uCardIds1 = userCards1.map((uc) => uc.card.id).sort();
    const uCardIds2 = userCards1.map((uc) => uc.card.id).sort();
    expect(cardIds).toEqual(uCardIds1);
    expect(cardIds).toEqual(uCardIds2);
    expect(uCardIds1).toEqual(uCardIds2);

    const IDS_1 = userCards1.map((uc) => uc.id).sort();
    const half = Math.ceil(IDS_1.length / 2);
    const firstHalf = IDS_1.splice(0, half);
    const secondHalf = IDS_1.splice(-half);

    for (const id of firstHalf) {
      await cardsService.deleteUserCard(userId, id);
    }
    const userCards2 = await cardsService.getUserCards(userId);
    expect(userCards2.length).toBe(5);
    const IDS_2 = userCards2.map((uc) => uc.id).sort();
    expect(IDS_2).toEqual(secondHalf);

    const uc1 = String(userCards2[0].id);
    await cardsService.learnUserCard(userId, uc1, false);

    const userCards3 = await cardsService.getUserCards(userId);
    expect(userCards3.length).toBe(4);
    for (const uc of userCards3) {
      await cardsService.learnUserCard(userId, uc.id, true);
    }

    await utils.sleep(intervalArray[0]);
    const userCards5 = await cardsService.getUserCards(userId);
    expect(userCards5.length).toBe(1);
    expect(userCards5[0].id).toBe(uc1);

    await cardsService.deleteUserCard(userId, uc1);
    const userCards6 = await cardsService.getUserCards(userId);
    expect(userCards6.length).toBe(0);

    await utils.sleep(intervalArray[1]);
    const userCards7 = await cardsService.getUserCards(userId);
    expect(userCards7.length).toBe(4);

    for (const uc of userCards7) {
      await cardsService.deleteUserCard(userId, uc.id);
    }

    const userCards8 = await cardsService.getUserCards(userId);
    expect(userCards8.length).toBe(0);
  });

  it("favorites", async () => {
    const tc = decksTestCases.case1;
    const file = {
      buffer: getBuffer(tc.pathToFile),
      mimetype: "csv",
      originalname: "userdeck1",
    };
    await decksService.createUserDeck(userId, file);

    let favorites = await cardsService.getFavorites(userId);
    expect(favorites.length).toBe(0);

    let userCards = await cardsService.getUserCards(userId);
    expect(userCards.length).toBe(tc.cardsCount);

    const uc1 = Object.assign({}, userCards[0]);

    // favorite
    await cardsService.favoriteUserCard(userId, uc1.id);
    favorites = await cardsService.getFavorites(userId);
    expect(favorites.length).toBe(1);
    expect(favorites.map((f) => f.id)).toContain(uc1.id);

    // unfavorite
    await cardsService.favoriteUserCard(userId, uc1.id);
    favorites = await cardsService.getFavorites(userId);
    expect(favorites.length).toBe(0);
    expect(favorites.map((f) => f.id)).not.toContain(uc1.id);

    // after deletion
    await cardsService.favoriteUserCard(userId, uc1.id);
    favorites = await cardsService.getFavorites(userId);
    expect(favorites.length).toBe(1);

    await cardsService.deleteUserCard(userId, uc1.id);
    favorites = await cardsService.getFavorites(userId);
    expect(favorites.length).toBe(0);
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("filterByCardId", () => {
  it("should be empty", () => {
    const cards1 = [] as ICard[];
    const userCards1 = [] as IUserCard[];
    const filtered1 = filterByCardId(cards1, userCards1);
    expect(filtered1.length).toBe(0);

    const cards2 = [{ _id: "1" }] as ICard[];
    const userCards2 = [{ card: "1" }] as IUserCard[];
    const filtered2 = filterByCardId(cards2, userCards2);
    expect(filtered2.length).toBe(0);

    const cards3 = [{ _id: "1" }, { _id: "3" }, { _id: "2" }] as ICard[];
    const userCards3 = [
      { card: "3" },
      { card: "1" },
      { card: "2" },
    ] as IUserCard[];
    const filtered3 = filterByCardId(cards3, userCards3);
    expect(filtered3.length).toBe(0);
  });
  it("should not be empty", () => {
    const cards1 = [{ _id: "1" }] as ICard[];
    const userCards1 = [] as IUserCard[];
    const filtered1 = filterByCardId(cards1, userCards1);
    expect(filtered1.length).toBe(1);

    const cards2 = [{ _id: "1" }, { _id: "2" }, { _id: "3" }] as ICard[];
    const userCards2 = [{ card: "1" }] as IUserCard[];
    const filtered2 = filterByCardId(cards2, userCards2);
    expect(filtered2.length).toBe(2);

    const cards3 = [
      { _id: "1" },
      { _id: "2" },
      { _id: "3" },
      { _id: "4" },
    ] as ICard[];
    const userCards3 = [
      { card: "4" },
      { card: "5" },
      { card: "6" },
      { card: "7" },
    ] as IUserCard[];
    const filtered3 = filterByCardId(cards3, userCards3);
    expect(filtered3.length).toBe(3);
  });
});
