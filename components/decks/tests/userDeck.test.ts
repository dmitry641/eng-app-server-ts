import { connectToTestDB, disconnectFromDB } from "../../../db";
import { decksTestCases } from "../../../test/testcases";
import { getBuffer } from "../../../utils";
import { globalCardsStore } from "../../flashcards/cards";
import { globalJobStore } from "../../schedule";
import { globalUserStore, User, UserDecksSettings } from "../../users/user";
import { DynamicSyncType, UserDeckPositionEnum } from "../../users/user.util";
import { globalDecksStore } from "../deck";
import { UserDecksService } from "../services/userDecks.service";
import { SyncClient, SYNC_TIMEOUT_LIMIT } from "../sync";
import {
  ascSortByOrderFn,
  UserDeck,
  UserDecksClient,
  userDecksManager,
} from "../userDeck";

// https://stackoverflow.com/questions/50091438/jest-how-to-mock-one-specific-method-of-a-class
jest.mock("../../schedule", () => {
  return {
    globalJobStore: {
      userJobs: {
        updateJob: jest.fn(() => null),
        cancelJob: jest.fn(() => null),
        createJob: jest.fn(() => null),
      },
    },
  };
});

jest.mock("../sync", () => {
  const originalModule = jest.requireActual("../sync");

  return {
    __esModule: true,
    ...originalModule,
    SYNC_TIMEOUT_LIMIT: 100,
    SYNC_ATTEMPTS_COUNT_LIMIT: 2,
  };
});

describe("UserDecksManager", () => {
  describe("getUserDecksClient", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });
  describe("getUserDecks", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });
});

describe("ascSortByOrderFn", () => {
  it("should sort by order(ascending)", () => {
    const arr = [{ order: 25 }, { order: 5 }, { order: 2 }, { order: 10 }];
    arr.sort(ascSortByOrderFn);
    expect(arr).toEqual([
      { order: 2 },
      { order: 5 },
      { order: 10 },
      { order: 25 },
    ]);
  });
  it("should be the same", () => {
    const arr = [{ order: 1 }, { order: 5 }, { order: 10 }];
    const arrCopy = [...arr];
    arr.sort(ascSortByOrderFn);
    expect(arr).toEqual(arrCopy);
  });
});

describe("UserDecksClient", () => {
  let userEmail = String(Math.random()) + "@email.com";
  let user: User;
  let udclient: UserDecksClient;
  beforeAll(async () => {
    await connectToTestDB();
    user = await globalUserStore.createUser({
      email: userEmail,
      name: "123",
      password: "123",
    });
    udclient = await userDecksManager.getUserDecksClient(user);
  });
  describe("createUserDeck", () => {
    it("correct file", async () => {
      const tc = decksTestCases.case1;
      const buffer = getBuffer(tc.pathToFile);
      const deckName = String(Math.random());

      const spyCreateDeck = jest.spyOn(globalDecksStore, "createDeck");
      const spyServiceCreate = jest.spyOn(UserDecksService, "createUserDeck");
      const userDeck = await udclient.createUserDeck({
        buffer,
        mimetype: "csv",
        originalname: deckName,
      });
      expect(spyCreateDeck).toBeCalled();
      expect(spyServiceCreate).toBeCalled();

      expect(userDeck.deckName).toBe(deckName);
      expect(userDeck.cardsCount).toBe(tc.cardsCount);
      expect(userDeck.cardsLearned).toBe(0);
      expect(userDeck.dynamic).toBe(false);
      expect(userDeck.enabled).toBe(true);
      expect(userDeck.deleted).toBe(false);
      const order = user.settings.userDecksSettings.maxOrder;
      expect(userDeck.order).toBe(order);

      const deck = globalDecksStore.getDeckById(userDeck.deckId);
      expect(deck.canBePublic).toBe(true);
      expect(deck.createdBy).toBe(user.id);
      expect(deck.name).toBe(deckName);
      expect(deck.public).toBe(false);
      expect(deck.totalCardsCount).toBe(tc.cardsCount);

      expect(userDeck.deckId).toBe(deck.id);

      const cards = globalCardsStore.getCardsByDeckId(deck.id);
      expect(cards.length).toBe(tc.cardsCount);

      const userDecks = udclient.getUserDecks();
      const includes = userDecks.includes(userDeck);
      expect(includes).toBe(true);
    });
    it("incorrect file", async () => {
      const tc = decksTestCases.case2;
      const buffer = getBuffer(tc.pathToFile);
      const deckName = String(Math.random());
      const userDeck = await udclient.createUserDeck({
        buffer,
        mimetype: "csv",
        originalname: deckName,
      });

      expect(userDeck.cardsCount).toBe(tc.cardsCount);

      const deck = globalDecksStore.getDeckById(userDeck.deckId);
      const cards = globalCardsStore.getCardsByDeckId(deck.id);
      expect(cards.length).toBe(tc.cardsCount);
    });
  });
  describe("createZipUserDeck", () => {
    it.todo("implement it");
  });
  describe("getUserDeckById", () => {
    let userDeck: UserDeck;
    const tc = decksTestCases.case1;
    const buffer = getBuffer(tc.pathToFile);
    beforeAll(async () => {
      userDeck = await udclient.createUserDeck({
        buffer,
        mimetype: "csv",
        originalname: String(Math.random()),
      });
    });
    it("userdeck exists", () => {
      const result = udclient.getUserDeckById(userDeck.id);
      expect(result).toBe(userDeck);
    });
    it("userdeck doesn't exist", () => {
      const fn = () => udclient.getUserDeckById(userDeck.deckId);
      expect(fn).toThrowError("UserDeck doesn't exist");
    });
  });
  describe("deleteUserDeck", () => {
    let userDeck: UserDeck;
    const tc = decksTestCases.case1;
    const buffer = getBuffer(tc.pathToFile);
    beforeAll(async () => {
      userDeck = await udclient.createUserDeck({
        buffer,
        mimetype: "csv",
        originalname: String(Math.random()),
      });
    });
    it("userdeck is deleted, userdecks are filtered", async () => {
      const spyDelete = jest.spyOn(userDeck, "delete");
      const spyEnable = jest.spyOn(userDeck, "enable");
      expect(userDeck.deleted).toBe(false);
      userDeck = await udclient.deleteUserDeck(userDeck.id);
      expect(userDeck.deleted).toBe(true);
      expect(spyDelete).toBeCalled();
      expect(spyEnable).not.toBeCalled();
      const userDecks = udclient.getUserDecks();
      expect(userDecks).not.toContain(userDeck);
    });
  });
  describe("enableUserDeck", () => {
    let userDeck: UserDeck;
    const tc = decksTestCases.case1;
    const buffer = getBuffer(tc.pathToFile);
    beforeAll(async () => {
      userDeck = await udclient.createUserDeck({
        buffer,
        mimetype: "csv",
        originalname: String(Math.random()),
      });
    });
    it("correct test", async () => {
      const spyDelete = jest.spyOn(userDeck, "delete");
      const spyEnable = jest.spyOn(userDeck, "enable");
      expect(userDeck.enabled).toBe(true);
      userDeck = await udclient.enableUserDeck(userDeck.id);
      expect(userDeck.enabled).toBe(false);
      expect(spyEnable).toBeCalled();
      expect(spyDelete).not.toBeCalled();
      userDeck = await udclient.enableUserDeck(userDeck.id);
      expect(userDeck.enabled).toBe(true);
    });
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("UserDecksClient: moveUserDeck", () => {
  let user: User;
  let udclient: UserDecksClient;
  let userDeck1: UserDeck;
  let userDeck2: UserDeck;
  let userDeck3: UserDeck;
  let userDeck4: UserDeck;
  let userDeck5: UserDeck;
  const tc = decksTestCases.case1;
  const buffer = getBuffer(tc.pathToFile);
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    let userEmail = String(Math.random()) + "@email.com";

    user = await globalUserStore.createUser({
      email: userEmail,
      name: "123",
      password: "123",
    });
    udclient = await userDecksManager.getUserDecksClient(user);
    userDeck1 = await udclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    userDeck2 = await udclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    userDeck3 = await udclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    userDeck4 = await udclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    userDeck5 = await udclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
  });

  it("multiply deck creation -> correct order", () => {
    expect(userDeck1.order).toBe(1);
    const firstLessThanSecond = userDeck1.order < userDeck2.order;
    expect(firstLessThanSecond).toBe(true);
    const secondLessThanThird = userDeck2.order < userDeck3.order;
    expect(secondLessThanThird).toBe(true);
    const userDecks = udclient.getUserDecks();
    const secondIndex = userDecks.findIndex((d) => d.id == userDeck2.id);
    const isFirst = userDecks[secondIndex - 1] === userDeck1;
    expect(isFirst).toBe(true);
    const isThird = userDecks[secondIndex + 1] === userDeck3;
    expect(isThird).toBe(true);
    expect(userDeck5.order).toBe(5);
    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });
  it("correct move: down", async () => {
    let userDecks = udclient.getUserDecks();
    const prevSecondIndex = userDecks.findIndex((d) => d.id == userDeck2.id);
    expect(prevSecondIndex).toBe(1);
    expect(userDeck1.order).toBe(1);
    expect(userDeck2.order).toBe(2);
    expect(userDeck3.order).toBe(3);
    expect(userDeck4.order).toBe(4);
    expect(userDeck5.order).toBe(5);
    await udclient.moveUserDeck(userDeck2.id, UserDeckPositionEnum.down);
    await udclient.moveUserDeck(userDeck2.id, UserDeckPositionEnum.down);
    userDecks = udclient.getUserDecks();
    const newSecondIndex = userDecks.findIndex((d) => d.id == userDeck2.id);
    expect(newSecondIndex).toBe(3);
    expect(userDeck1.order).toBe(1);
    expect(userDeck3.order).toBe(2);
    expect(userDeck4.order).toBe(3);
    expect(userDeck2.order).toBe(4);
    expect(userDeck5.order).toBe(5);
    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });
  it("correct move: up", async () => {
    let userDecks = udclient.getUserDecks();
    const prevFourthIndex = userDecks.findIndex((d) => d.id == userDeck4.id);
    expect(prevFourthIndex).toBe(3);
    expect(userDeck1.order).toBe(1);
    expect(userDeck2.order).toBe(2);
    expect(userDeck3.order).toBe(3);
    expect(userDeck4.order).toBe(4);
    expect(userDeck5.order).toBe(5);
    await udclient.moveUserDeck(userDeck4.id, UserDeckPositionEnum.up);
    await udclient.moveUserDeck(userDeck4.id, UserDeckPositionEnum.up);
    await udclient.moveUserDeck(userDeck4.id, UserDeckPositionEnum.up);
    userDecks = udclient.getUserDecks();
    const newFourthIndex = userDecks.findIndex((d) => d.id == userDeck4.id);
    expect(newFourthIndex).toBe(0);
    expect(userDeck4.order).toBe(1);
    expect(userDeck1.order).toBe(2);
    expect(userDeck2.order).toBe(3);
    expect(userDeck3.order).toBe(4);
    expect(userDeck5.order).toBe(5);
    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });
  it("incorrect move: down", async () => {
    let userDecks = udclient.getUserDecks();
    const prevFifthIndex = userDecks.findIndex((d) => d.id == userDeck5.id);
    expect(prevFifthIndex).toBe(4);
    await udclient.moveUserDeck(userDeck5.id, UserDeckPositionEnum.down);
    userDecks = udclient.getUserDecks();
    const newFifthIndex = userDecks.findIndex((d) => d.id == userDeck5.id);
    expect(newFifthIndex).toBe(4);
    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });
  it("incorrect move: up", async () => {
    let userDecks = udclient.getUserDecks();
    const prevFirstIndex = userDecks.findIndex((d) => d.id == userDeck1.id);
    expect(prevFirstIndex).toBe(0);
    await udclient.moveUserDeck(userDeck1.id, UserDeckPositionEnum.up);
    userDecks = udclient.getUserDecks();
    const newFirstIndex = userDecks.findIndex((d) => d.id == userDeck1.id);
    expect(newFirstIndex).toBe(0);
    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });
  it("correct move + delete deck", async () => {
    await udclient.deleteUserDeck(userDeck2.id);
    await udclient.moveUserDeck(userDeck3.id, UserDeckPositionEnum.up);
    let userDecks = udclient.getUserDecks();
    expect(userDecks[0]).toBe(userDeck3);
    expect(userDeck3.order).toBe(1);
    expect(userDeck1.order).toBe(3);
    expect(userDeck4.order).toBe(4);
    expect(userDeck5.order).toBe(5);
    await udclient.moveUserDeck(userDeck4.id, UserDeckPositionEnum.down);
    await udclient.deleteUserDeck(userDeck5.id);
    userDecks = udclient.getUserDecks();
    expect(userDecks.length).toBe(3);
    const lastUserDeck = userDecks.at(-1);
    expect(lastUserDeck).toBe(userDeck4);
    expect(userDeck3.order).toBe(1);
    expect(userDeck1.order).toBe(3);
    expect(userDeck4.order).toBe(5);
    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });
  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("UserDecksClient: public decks", () => {
  let user1: User;
  let user2: User;
  let user1dclient: UserDecksClient;
  let user2dclient: UserDecksClient;
  let user1Deck1: UserDeck;
  let user1Deck2: UserDeck;
  let user2Deck1: UserDeck;
  let user2Deck2: UserDeck;

  const tc = decksTestCases.case1;
  const buffer = getBuffer(tc.pathToFile);
  beforeAll(async () => {
    await connectToTestDB();
    user1 = await globalUserStore.createUser({
      email: String(Math.random()) + "@111.com",
      name: "111",
      password: "123",
    });
    user2 = await globalUserStore.createUser({
      email: String(Math.random()) + "@222.com",
      name: "222",
      password: "123",
    });
    user1dclient = await userDecksManager.getUserDecksClient(user1);
    user2dclient = await userDecksManager.getUserDecksClient(user2);

    user1Deck1 = await user1dclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    user1Deck2 = await user1dclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    user2Deck1 = await user2dclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    user2Deck2 = await user2dclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
  });

  it("getPublicDecks", async () => {
    let publicUser1Decks = user1dclient.getPublicDecks();
    expect(publicUser1Decks.length).toBe(0);
    let publicUser2Decks = user2dclient.getPublicDecks();
    expect(publicUser2Decks.length).toBe(0);
    const deck = await user1dclient.toggleUserDeckPublic(user1Deck1.id);

    publicUser1Decks = user1dclient.getPublicDecks();
    expect(publicUser1Decks.length).toBe(0);
    publicUser2Decks = user2dclient.getPublicDecks();
    expect(publicUser2Decks.length).toBe(1);
    expect(publicUser2Decks[0]).toBe(deck);
    expect(publicUser2Decks[0].createdBy).toBe(user1.id);

    const user1Decks = user1dclient.getUserDecks();
    expect(publicUser2Decks[0].id).toBe(user1Decks[0].deckId);

    await user1dclient.toggleUserDeckPublic(user1Deck1.id);
    publicUser2Decks = user2dclient.getPublicDecks();
    expect(publicUser2Decks.length).toBe(0);
  });

  it("toggleUserDeckPublic", async () => {
    await user2dclient.toggleUserDeckPublic(user2Deck1.id);
    await user2dclient.toggleUserDeckPublic(user2Deck2.id);
    let publicUser1Decks = user1dclient.getPublicDecks();
    let publicUser2Decks = user2dclient.getPublicDecks();
    expect(publicUser1Decks.length).toBe(2);
    expect(publicUser2Decks.length).toBe(0);

    await user2dclient.toggleUserDeckPublic(user2Deck1.id);
    await user2dclient.toggleUserDeckPublic(user2Deck2.id);
    publicUser1Decks = user1dclient.getPublicDecks();
    expect(publicUser1Decks.length).toBe(0);
  });
  it("toggleUserDeckPublic: dynamic deck", async () => {
    const dynUserDeck = await user1dclient.createDynamicUserDeck();
    try {
      await user1dclient.toggleUserDeckPublic(dynUserDeck.id);
    } catch (error) {
      expect(error).toMatchObject({
        message: "Dynamic deck cannot be public",
      });
    }
    await user1dclient.deleteDynamicUserDeck();
  });

  it("addPublicDeckToUserDecks", async () => {
    let user1Decks = user1dclient.getUserDecks();
    expect(user1Decks.length).toBe(2);
    let user2Decks = user2dclient.getUserDecks();
    expect(user2Decks.length).toBe(2);
    await user2dclient.toggleUserDeckPublic(user2Deck1.id);
    let publicUser1Decks = user1dclient.getPublicDecks();
    expect(publicUser1Decks.length).toBe(1);
    await user1dclient.addPublicDeckToUserDecks(publicUser1Decks[0].id);
    user1Decks = user1dclient.getUserDecks();
    expect(user1Decks.length).toBe(3);
    user2Decks = user2dclient.getUserDecks();
    expect(user2Decks.length).toBe(2);

    await user2dclient.toggleUserDeckPublic(user2Deck1.id);
    publicUser1Decks = user1dclient.getPublicDecks();
    expect(publicUser1Decks.length).toBe(0);
    user1Decks = user1dclient.getUserDecks();
    expect(user1Decks.length).toBe(3);
  });
  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("UserDecksClient: dynamic deck", () => {
  let user: User;
  let udclient: UserDecksClient;
  let userDeck1: UserDeck;
  let userDeck2: UserDeck;
  const tc = decksTestCases.case1;
  const buffer = getBuffer(tc.pathToFile);
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    let userEmail = String(Math.random()) + "@email.com";

    user = await globalUserStore.createUser({
      email: userEmail,
      name: "123",
      password: "123",
    });
    udclient = await userDecksManager.getUserDecksClient(user);
    userDeck1 = await udclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    userDeck2 = await udclient.createUserDeck({
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
  });

  it("createDynamicUserDeck", async () => {
    let dynUserDeck = udclient.getDynamicUserDeck();
    expect(dynUserDeck).toBe(undefined);

    const spyCreateDeck = jest.spyOn(globalDecksStore, "createDynamicDeck");
    const spyServiceCreate = jest.spyOn(UserDecksService, "createUserDeck");
    const spyUpdateAutoSync = jest.spyOn(udclient, "updateAutoSync");

    const userDeck = await udclient.createDynamicUserDeck();
    expect(spyCreateDeck).toBeCalled();
    expect(spyServiceCreate).toBeCalled();
    expect(spyUpdateAutoSync).toBeCalled();

    let settings = udclient.getUserDeckSettings();
    expect(settings.dynamicAutoSync).toBe(true);

    expect(globalJobStore.userJobs.updateJob).toBeCalled();

    expect(userDeck.deckName).toBe("Dynamic deck");
    expect(userDeck.cardsCount).toBe(0);
    expect(userDeck.cardsLearned).toBe(0);
    expect(userDeck.dynamic).toBe(true);
    expect(userDeck.enabled).toBe(true);
    expect(userDeck.deleted).toBe(false);
    const order = user.settings.userDecksSettings.maxOrder;
    expect(userDeck.order).toBe(order);

    const deck = globalDecksStore.getDeckById(userDeck.deckId);
    expect(deck.canBePublic).toBe(false);
    expect(deck.createdBy).toBe(user.id);
    expect(deck.name).toBe("Dynamic deck");
    expect(deck.public).toBe(false);
    expect(deck.totalCardsCount).toBe(0);

    expect(userDeck.deckId).toBe(deck.id);

    const cards = globalCardsStore.getCardsByDeckId(deck.id);
    expect(cards.length).toBe(0);

    const userDecks = udclient.getUserDecks();
    const includes = userDecks.includes(userDeck);
    expect(includes).toBe(true);

    dynUserDeck = udclient.getDynamicUserDeck();
    expect(dynUserDeck).toBeTruthy();

    try {
      await udclient.createDynamicUserDeck();
    } catch (error) {
      expect(error).toMatchObject({
        message: "Dynamic userDeck already exists",
      });
    }

    await udclient.deleteDynamicUserDeck();
  });
  it("deleteDynamicUserDeck", async () => {
    let dynUserDeck = udclient.getDynamicUserDeck();
    expect(dynUserDeck).toBe(undefined);
    await udclient.createDynamicUserDeck();
    dynUserDeck = udclient.getDynamicUserDeck();
    expect(dynUserDeck).toBeTruthy();
    let userDecks = udclient.getUserDecks();
    expect(userDecks).toContain(dynUserDeck);

    const settings = await udclient.deleteDynamicUserDeck();

    userDecks = udclient.getUserDecks();
    expect(userDecks).not.toContain(dynUserDeck);

    expect(settings.dynamicAutoSync).toBe(false);
    expect(settings.dynamicSyncType).toBe(undefined);
    expect(settings.dynamicSyncData).toBe(undefined);
    expect(settings.dynamicSyncMessage).toBe(undefined);
    expect(settings.dynamicSyncAttempts.length).toBe(0);

    expect(globalJobStore.userJobs.cancelJob).toBeCalled();

    try {
      await udclient.deleteDynamicUserDeck();
    } catch (error) {
      expect(error).toMatchObject({
        message: "Dynamic userDeck doesn't exist",
      });
    }
  });
  it("syncDynamicUserDeck", async () => {
    await udclient.createDynamicUserDeck();

    try {
      await udclient.syncDynamicUserDeck();
    } catch (error) {
      expect(error).toMatchObject({
        message: "DynamicSyncType is undefined",
      });
    }
    await udclient.updateSyncDataType(DynamicSyncType.reverso, {
      accountName: "test",
    });

    // syncHandler -> false
    SyncClient.prototype.syncHandler = jest.fn(async () => false);
    let spySyncHandler = jest.spyOn(SyncClient.prototype, "syncHandler");
    let spyDynSyncMsg = jest.spyOn(
      UserDecksSettings.prototype,
      "setDynamicSyncMessage"
    );
    let spyDynSyncAuto = jest.spyOn(
      UserDecksSettings.prototype,
      "setDynamicAutoSync"
    );
    await udclient.syncDynamicUserDeck();
    expect(spySyncHandler).toBeCalled();
    expect(spyDynSyncAuto).toBeCalledWith(false);
    expect(spyDynSyncMsg).toBeCalledWith("Sync error");
    expect(globalJobStore.userJobs.cancelJob).toBeCalled();

    // syncHandler -> true
    SyncClient.prototype.syncHandler = jest.fn(async () => true);
    spySyncHandler = jest.spyOn(SyncClient.prototype, "syncHandler");
    spyDynSyncMsg = jest.spyOn(
      UserDecksSettings.prototype,
      "setDynamicSyncMessage"
    );
    await udclient.syncDynamicUserDeck();
    expect(spySyncHandler).toBeCalled();
    expect(spyDynSyncMsg).toBeCalledWith(
      expect.stringContaining("Last sync at")
    );

    try {
      await udclient.syncDynamicUserDeck();
    } catch (error) {
      expect(error).toMatchObject({
        message: "Too many attempts. Try again later...",
      });
    }

    // jest.useFakeTimers();
    // jest.runAllTimers();
    await new Promise((r) => setTimeout(r, SYNC_TIMEOUT_LIMIT));
    await udclient.syncDynamicUserDeck();
    expect(spySyncHandler).toBeCalled();
    expect(spyDynSyncMsg).toBeCalledWith(
      expect.stringContaining("Last sync at")
    );

    await udclient.deleteDynamicUserDeck();
  });
  it("updateSyncDataType", async () => {
    const accName = "test";
    const settings = await udclient.updateSyncDataType(
      DynamicSyncType.reverso,
      { accountName: accName }
    );
    expect(globalJobStore.userJobs.updateJob).toBeCalled();
    expect(settings.dynamicSyncType).toBe(DynamicSyncType.reverso);
    expect(settings.dynamicSyncData).toMatchObject({ accountName: accName });
  });
  it("updateAutoSync", async () => {
    let settings = await udclient.updateAutoSync(false);
    expect(globalJobStore.userJobs.updateJob).toBeCalled();
    expect(settings.dynamicAutoSync).toBe(false);
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("function: isSortedByOrder", () => {
  it("should return true", () => {
    const arr1 = [{ order: 5 }];
    const arr2 = [{ order: 5 }, { order: 10 }];
    const arr3 = [{ order: 5 }, { order: 10 }, { order: 15 }];
    const arr4 = [{ order: 0 }, { order: 0 }, { order: 0 }, { order: 0 }];
    const result1 = isSortedByOrder(arr1);
    const result2 = isSortedByOrder(arr2);
    const result3 = isSortedByOrder(arr3);
    const result4 = isSortedByOrder(arr4);
    expect(result1).toBe(true);
    expect(result2).toBe(true);
    expect(result3).toBe(true);
    expect(result4).toBe(true);
  });
  it("should return false", () => {
    const arr1 = [{ order: 25 }, { order: 10 }];
    const arr2 = [{ order: 25 }, { order: 10 }, { order: 115 }];
    const arr3 = [{ order: 1 }, { order: 0 }, { order: 1 }, { order: 0 }];
    const result1 = isSortedByOrder(arr1);
    const result2 = isSortedByOrder(arr2);
    const result3 = isSortedByOrder(arr3);
    expect(result1).toBe(false);
    expect(result2).toBe(false);
    expect(result3).toBe(false);
  });
});
function isSortedByOrder<T extends { order: number }>(arr: T[]): boolean {
  let result = true;
  if (arr.length <= 1) return result;

  let prevEl = arr[0].order;
  for (let index = 1; index < arr.length; index++) {
    const currEl = arr[index].order;
    if (prevEl > currEl) return false;
    prevEl = currEl;
  }
  return result;
}
