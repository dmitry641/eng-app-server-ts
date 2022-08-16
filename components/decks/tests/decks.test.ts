import mongoose from "mongoose";
import { connectToTestDB, disconnectFromDB } from "../../../db";
import { decksTestCases, reversoTestLink } from "../../../test/testcases";
import { getBuffer } from "../../../utils";
import { cardsService } from "../../cards/cards.service";
import { globalJobStore } from "../../schedule";
import { userService } from "../../users/users.service";
import { DecksService, decksService } from "../decks.service";
import {
  DynamicSyncType,
  SYNC_TIMEOUT_LIMIT,
  UDPositionEnum,
  UserDeckDTO,
} from "../decks.util";
import { DeckInput, DeckModel } from "../models/decks.model";
import { UserDeckModel } from "../models/userDecks.model";
import { SyncClient } from "../sync";

describe("Decks service: createDeck", () => {
  let userId: string;
  beforeAll(async () => {
    await connectToTestDB();
    const user = await userService.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    userId = user.id;
  });

  it("test required fields", async () => {
    try {
      // @ts-ignore
      const deckInput: DeckInput = {
        totalCardsCount: 0,
        name: "qwerty",
      };
      await DeckModel.create(deckInput);
    } catch (error) {
      let err = error as mongoose.Error.ValidationError;
      expect(err.message).toMatch(
        "Deck validation failed: createdBy: Path `createdBy` is required."
      );
    }
  });

  it("wrong type", async () => {
    const deckInput: DeckInput = {
      // @ts-ignore
      totalCardsCount: "something",
      name: "qwerty",
      createdBy: userId,
    };

    let errMsg;
    try {
      await DeckModel.create(deckInput);
    } catch (error) {
      let err = error as mongoose.Error.ValidationError;
      errMsg = err.message;
    }
    expect(errMsg).toMatch(
      "Deck validation failed: totalCardsCount: Cast to Number failed"
    );
  });

  // ожидалось что будет ошибка, а не нет...
  // it("wrong ref", async () => {
  //   const id =
  //     new mongoose.Types.ObjectId() as unknown as mongoose.Schema.Types.ObjectId;

  //   let isError = false;
  //   try {
  //     const deck = await DecksService.createDeck({
  //       canBePublic: true,
  //       totalCardsCount: 0,
  //       name: "qwerty",
  //       createdBy: id,
  //     });
  //     // console.log(deck);
  //   } catch (error) {
  //     isError = true;
  //     let err = error as mongoose.Error.ValidationError;
  //     expect(err.message).toMatch("1");
  //   }
  //   expect(isError).toBe(true);
  // });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

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

jest.mock("../decks.util", () => {
  const originalModule = jest.requireActual("../decks.util");

  return {
    __esModule: true,
    ...originalModule,
    SYNC_TIMEOUT_LIMIT: 100,
    SYNC_ATTEMPTS_COUNT_LIMIT: 2,
  };
});

describe("Decks service", () => {
  let userId: string;
  beforeAll(async () => {
    await connectToTestDB();
    const user = await userService.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    userId = user.id;
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUserDeck and delete", () => {
    let userDeck: UserDeckDTO;
    it("correct file", async () => {
      const tc = decksTestCases.case1;
      const buffer = getBuffer(tc.pathToFile);
      const deckName = String(Math.random());

      const spyCreateDeck = jest.spyOn(DeckModel, "create");
      const spyCreateUserDeck = jest.spyOn(UserDeckModel, "create");
      userDeck = await decksService.createUserDeck(userId, {
        buffer,
        mimetype: "csv",
        originalname: deckName,
      });
      expect(spyCreateDeck).toBeCalled();
      expect(spyCreateUserDeck).toBeCalled();

      expect(userDeck.deck.name).toBe(deckName);
      expect(userDeck.cardsCount).toBe(tc.cardsCount);
      expect(userDeck.cardsLearned).toBe(0);
      expect(userDeck.dynamic).toBe(false);
      expect(userDeck.enabled).toBe(true);
      expect(userDeck.deleted).toBe(false);
      const decksSettings = await decksService.getDecksSettings(userId);
      const order = decksSettings.maxOrder;
      expect(userDeck.order).toBe(order);

      const deck = await decksService.getDeckById(userDeck.deck.id);
      expect(deck.createdBy.id).toBe(userId);
      expect(deck.name).toBe(deckName);
      expect(deck.public).toBe(false);
      expect(deck.totalCardsCount).toBe(tc.cardsCount);

      expect(userDeck.deck.id).toBe(deck.id);

      const cards = await cardsService.getCardsByDeckId(deck.id);
      expect(cards.length).toBe(tc.cardsCount);

      const userDecks = await decksService.getUserDecks(userId);
      expect(userDecks).toContainEqual(userDeck);
    });
    it("incorrect file", async () => {
      const tc = decksTestCases.case2;
      const buffer = getBuffer(tc.pathToFile);
      const deckName = String(Math.random());
      const userDeck = await decksService.createUserDeck(userId, {
        buffer,
        mimetype: "csv",
        originalname: deckName,
      });

      expect(userDeck.cardsCount).toBe(tc.cardsCount);

      const deck = await decksService.getDeckById(userDeck.deck.id);
      const cards = await cardsService.getCardsByDeckId(deck.id);
      expect(cards.length).toBe(tc.cardsCount);
    });
    it("userdeck exists", async () => {
      const userDecks = await decksService.getUserDecks(userId);
      expect(userDecks[0]).toEqual(userDeck);
    });
    it("userdeck is deleted, userdecks are filtered", async () => {
      const spyDelete = jest.spyOn(DecksService.prototype, "deleteUserDeck");
      const spyEnable = jest.spyOn(DecksService.prototype, "enableUserDeck");
      expect(userDeck.deleted).toBe(false);
      await decksService.deleteUserDeck(userId, userDeck.id);
      expect(spyDelete).toBeCalled();
      expect(spyEnable).not.toBeCalled();
      const userDecks = await decksService.getUserDecks(userId);
      expect(userDecks).not.toContain(userDeck);
    });
  });

  describe("createZipUserDeck", () => {
    it.todo("implement it");
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("Decks service: moveUserDeck", () => {
  let userId: string;
  let userDeck1_id: string;
  let userDeck2_id: string;
  let userDeck3_id: string;
  let userDeck4_id: string;
  let userDeck5_id: string;
  const tc = decksTestCases.case1;
  const buffer = getBuffer(tc.pathToFile);
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    let userEmail = String(Math.random()) + "@email.com";

    const user = await userService.createUser({
      email: userEmail,
      name: "123",
      password: "123",
    });
    userId = user.id;

    let userDeck1 = await decksService.createUserDeck(userId, {
      buffer,
      mimetype: "csv",
      originalname: "userDeck1",
    });
    userDeck1_id = userDeck1.id;
    let userDeck2 = await decksService.createUserDeck(userId, {
      buffer,
      mimetype: "csv",
      originalname: "userDeck2",
    });
    userDeck2_id = userDeck2.id;
    let userDeck3 = await decksService.createUserDeck(userId, {
      buffer,
      mimetype: "csv",
      originalname: "userDeck3",
    });
    userDeck3_id = userDeck3.id;
    let userDeck4 = await decksService.createUserDeck(userId, {
      buffer,
      mimetype: "csv",
      originalname: "userDeck4",
    });
    userDeck4_id = userDeck4.id;
    let userDeck5 = await decksService.createUserDeck(userId, {
      buffer,
      mimetype: "csv",
      originalname: "userDeck5",
    });
    userDeck5_id = userDeck5.id;
  });

  async function gUDbyId(userDeckId: string): Promise<UserDeckDTO> {
    const userDecks = await decksService.getUserDecks(userId);
    const userDeck = userDecks.find((ud) => ud.id === userDeckId);
    if (!userDeck) throw new Error("User deck not found");
    return userDeck;
  }

  it("multiply deck creation -> correct order", async () => {
    const ud1 = await gUDbyId(userDeck1_id);
    expect(ud1.order).toBe(1);
    const ud2 = await gUDbyId(userDeck2_id);
    const firstLessThanSecond = ud1.order < ud2.order;
    expect(firstLessThanSecond).toBe(true);
    const ud3 = await gUDbyId(userDeck3_id);
    const secondLessThanThird = ud2.order < ud3.order;
    expect(secondLessThanThird).toBe(true);
    const userDecks = await decksService.getUserDecks(userId);
    const secondIndex = userDecks.findIndex((ud) => ud.id == userDeck2_id);
    const isFirst = userDecks[secondIndex - 1].id === userDeck1_id;
    expect(isFirst).toBe(true);
    const isThird = userDecks[secondIndex + 1].id === userDeck3_id;
    expect(isThird).toBe(true);
    const ud5 = await gUDbyId(userDeck5_id);
    expect(ud5.order).toBe(5);
    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });

  it("correct move: down", async () => {
    let userDecks = await decksService.getUserDecks(userId);
    const prevSecondIndex = userDecks.findIndex((ud) => ud.id == userDeck2_id);
    expect(prevSecondIndex).toBe(1);

    let ud1 = await gUDbyId(userDeck1_id);
    let ud2 = await gUDbyId(userDeck2_id);
    let ud3 = await gUDbyId(userDeck3_id);
    let ud4 = await gUDbyId(userDeck4_id);
    let ud5 = await gUDbyId(userDeck5_id);
    expect(ud1.order).toBe(1);
    expect(ud2.order).toBe(2);
    expect(ud3.order).toBe(3);
    expect(ud4.order).toBe(4);
    expect(ud5.order).toBe(5);

    await decksService.moveUserDeck(userId, userDeck2_id, UDPositionEnum.down);
    await decksService.moveUserDeck(userId, userDeck2_id, UDPositionEnum.down);

    userDecks = await decksService.getUserDecks(userId);

    const newSecondIndex = userDecks.findIndex((ud) => ud.id == userDeck2_id);
    expect(newSecondIndex).toBe(3);

    ud1 = await gUDbyId(userDeck1_id);
    ud2 = await gUDbyId(userDeck2_id);
    ud3 = await gUDbyId(userDeck3_id);
    ud4 = await gUDbyId(userDeck4_id);
    ud5 = await gUDbyId(userDeck5_id);
    expect(ud1.order).toBe(1);
    expect(ud3.order).toBe(2);
    expect(ud4.order).toBe(3);
    expect(ud2.order).toBe(4);
    expect(ud5.order).toBe(5);

    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });

  it("correct move: up", async () => {
    let userDecks = await decksService.getUserDecks(userId);
    const prevFourthIndex = userDecks.findIndex((ud) => ud.id == userDeck4_id);
    expect(prevFourthIndex).toBe(3);

    let ud1 = await gUDbyId(userDeck1_id);
    let ud2 = await gUDbyId(userDeck2_id);
    let ud3 = await gUDbyId(userDeck3_id);
    let ud4 = await gUDbyId(userDeck4_id);
    let ud5 = await gUDbyId(userDeck5_id);
    expect(ud1.order).toBe(1);
    expect(ud2.order).toBe(2);
    expect(ud3.order).toBe(3);
    expect(ud4.order).toBe(4);
    expect(ud5.order).toBe(5);

    await decksService.moveUserDeck(userId, userDeck4_id, UDPositionEnum.up);
    await decksService.moveUserDeck(userId, userDeck4_id, UDPositionEnum.up);
    await decksService.moveUserDeck(userId, userDeck4_id, UDPositionEnum.up);
    userDecks = await decksService.getUserDecks(userId);
    const newFourthIndex = userDecks.findIndex((ud) => ud.id == userDeck4_id);
    expect(newFourthIndex).toBe(0);

    ud1 = await gUDbyId(userDeck1_id);
    ud2 = await gUDbyId(userDeck2_id);
    ud3 = await gUDbyId(userDeck3_id);
    ud4 = await gUDbyId(userDeck4_id);
    ud5 = await gUDbyId(userDeck5_id);
    expect(ud4.order).toBe(1);
    expect(ud1.order).toBe(2);
    expect(ud2.order).toBe(3);
    expect(ud3.order).toBe(4);
    expect(ud5.order).toBe(5);

    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });

  it("incorrect move: down", async () => {
    let userDecks = await decksService.getUserDecks(userId);
    const prevFifthIndex = userDecks.findIndex((ud) => ud.id == userDeck5_id);
    expect(prevFifthIndex).toBe(4);
    await decksService.moveUserDeck(userId, userDeck5_id, UDPositionEnum.down);

    userDecks = await decksService.getUserDecks(userId);
    const newFifthIndex = userDecks.findIndex((ud) => ud.id == userDeck5_id);
    expect(newFifthIndex).toBe(4);

    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });

  it("incorrect move: up", async () => {
    let userDecks = await decksService.getUserDecks(userId);
    const prevFirstIndex = userDecks.findIndex((ud) => ud.id == userDeck1_id);
    expect(prevFirstIndex).toBe(0);
    await decksService.moveUserDeck(userId, userDeck1_id, UDPositionEnum.up);

    userDecks = await decksService.getUserDecks(userId);
    const newFirstIndex = userDecks.findIndex((d) => d.id == userDeck1_id);
    expect(newFirstIndex).toBe(0);

    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });

  it("correct move + delete deck", async () => {
    await decksService.deleteUserDeck(userId, userDeck2_id);
    await decksService.moveUserDeck(userId, userDeck3_id, UDPositionEnum.up);
    let userDecks = await decksService.getUserDecks(userId);
    expect(userDecks[0].id).toBe(userDeck3_id);

    let ud1 = await gUDbyId(userDeck1_id);
    let ud3 = await gUDbyId(userDeck3_id);
    let ud4 = await gUDbyId(userDeck4_id);
    let ud5 = await gUDbyId(userDeck5_id);
    expect(ud3.order).toBe(1);
    expect(ud1.order).toBe(3);
    expect(ud4.order).toBe(4);
    expect(ud5.order).toBe(5);
    await decksService.moveUserDeck(userId, userDeck4_id, UDPositionEnum.down);
    await decksService.deleteUserDeck(userId, userDeck5_id);

    userDecks = await decksService.getUserDecks(userId);
    expect(userDecks.length).toBe(3);
    const lastUserDeck = userDecks.at(-1);
    expect(lastUserDeck?.id).toBe(userDeck4_id);

    ud3 = await gUDbyId(userDeck3_id);
    ud1 = await gUDbyId(userDeck1_id);
    ud4 = await gUDbyId(userDeck4_id);
    expect(ud3.order).toBe(1);
    expect(ud1.order).toBe(3);
    expect(ud4.order).toBe(5);

    const isSorted = isSortedByOrder(userDecks);
    expect(isSorted).toBe(true);
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("Decks service: public decks", () => {
  let user1Id: string;
  let user2Id: string;
  let user1Deck1: UserDeckDTO;
  let user1Deck2: UserDeckDTO;
  let user2Deck1: UserDeckDTO;
  let user2Deck2: UserDeckDTO;

  const tc = decksTestCases.case1;
  const buffer = getBuffer(tc.pathToFile);
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    await DeckModel.deleteMany({ public: true });

    const user1 = await userService.createUser({
      email: String(Math.random()) + "@111.com",
      name: "111",
      password: "123",
    });
    user1Id = user1.id;
    const user2 = await userService.createUser({
      email: String(Math.random()) + "@222.com",
      name: "222",
      password: "123",
    });
    user2Id = user2.id;

    user1Deck1 = await decksService.createUserDeck(user1Id, {
      buffer,
      mimetype: "csv",
      originalname: "user1Deck1",
    });
    user1Deck2 = await decksService.createUserDeck(user1Id, {
      buffer,
      mimetype: "csv",
      originalname: "user1Deck2",
    });
    user2Deck1 = await decksService.createUserDeck(user2Id, {
      buffer,
      mimetype: "csv",
      originalname: "user2Deck1",
    });
    user2Deck2 = await decksService.createUserDeck(user2Id, {
      buffer,
      mimetype: "csv",
      originalname: "user2Deck2",
    });
  });

  it("getPublicDecks", async () => {
    let publicUser1Decks = await decksService.getPublicDecks(user1Id);
    expect(publicUser1Decks.length).toBe(0);
    let publicUser2Decks = await decksService.getPublicDecks(user2Id);
    expect(publicUser2Decks.length).toBe(0);
    const userDeck = await decksService.publishUserDeck(user1Id, user1Deck1.id);

    publicUser1Decks = await decksService.getPublicDecks(user1Id);
    expect(publicUser1Decks.length).toBe(0);
    publicUser2Decks = await decksService.getPublicDecks(user2Id);
    expect(publicUser2Decks.length).toBe(1);
    expect(publicUser2Decks[0].id).toEqual(userDeck.deck.id);
    expect(publicUser2Decks[0].createdBy.id).toBe(user1Id);

    const user1Decks = await decksService.getUserDecks(user1Id);
    expect(publicUser2Decks[0].id).toBe(user1Decks[0].deck.id);

    await decksService.publishUserDeck(user1Id, user1Deck1.id);
    publicUser2Decks = await decksService.getPublicDecks(user2Id);
    expect(publicUser2Decks.length).toBe(0);
  });

  it("publishUserDeck, case 1", async () => {
    await decksService.publishUserDeck(user2Id, user2Deck1.id);
    await decksService.publishUserDeck(user2Id, user2Deck2.id);
    let publicUser1Decks = await decksService.getPublicDecks(user1Id);
    let publicUser2Decks = await decksService.getPublicDecks(user2Id);
    expect(publicUser1Decks.length).toBe(2);
    expect(publicUser2Decks.length).toBe(0);

    await decksService.publishUserDeck(user2Id, user2Deck1.id);
    await decksService.publishUserDeck(user2Id, user2Deck2.id);
    publicUser1Decks = await decksService.getPublicDecks(user1Id);
    expect(publicUser1Decks.length).toBe(0);
  });
  it("publishUserDeck, case 2", async () => {
    let pub1 = await decksService.getPublicDecks(user1Id);
    expect(pub1.length).toBe(0);
    let pub2 = await decksService.getPublicDecks(user2Id);
    expect(pub2.length).toBe(0);

    const user1ds = await decksService.getUserDecks(user1Id);
    expect(user1ds.length).toBe(2);
    for (const ud of user1ds) {
      expect(ud.published).toBe(false);
      expect(ud.canPublish).toBe(true);
    }

    const pubU1D1 = await decksService.publishUserDeck(user1Id, user1ds[0].id);
    expect(pubU1D1.published).toBe(true);
    expect(pubU1D1.canPublish).toBe(true);

    pub1 = await decksService.getPublicDecks(user1Id);
    expect(pub1.length).toBe(0);
    pub2 = await decksService.getPublicDecks(user2Id);
    expect(pub2[0].id).toBe(pubU1D1.deck.id);
    expect(pub2[0].createdBy.id).toBe(user1Id);

    let user2ds = await decksService.getUserDecks(user2Id);
    expect(user2ds.length).toBe(2);
    const addedPD1 = await decksService.addPublicDeck(user2Id, pub2[0].id);
    expect(addedPD1.canPublish).toBe(false);
    expect(addedPD1.published).toBe(true);

    pub2 = await decksService.getPublicDecks(user2Id);
    expect(pub2.length).toBe(0);
    user2ds = await decksService.getUserDecks(user2Id);
    expect(user2ds.length).toBe(3);

    let errMsg;
    try {
      await decksService.publishUserDeck(user2Id, addedPD1.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Only the owner can make changes");
  });

  it("publishUserDeck: dynamic deck", async () => {
    const dynUserDeck = await decksService.createDynamicUserDeck(user1Id);
    expect(dynUserDeck.published).toBe(false);
    expect(dynUserDeck.canPublish).toBe(false);
    let errMsg;
    try {
      await decksService.publishUserDeck(user1Id, dynUserDeck.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Dynamic deck cannot be public");

    const pub2 = await decksService.getPublicDecks(user2Id);
    expect(pub2.length).toBe(0);
    try {
      await decksService.addPublicDeck(user2Id, dynUserDeck.deck.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Deck cannot be added");

    await decksService.deleteDynamicUserDeck(user1Id);
  });

  it("addPublicDeck, case 1", async () => {
    let user1Decks = await decksService.getUserDecks(user1Id);
    expect(user1Decks.length).toBe(2);
    let user2Decks = await decksService.getUserDecks(user2Id);
    expect(user2Decks.length).toBe(2);
    await decksService.publishUserDeck(user2Id, user2Deck1.id);
    let publicUser1Decks = await decksService.getPublicDecks(user1Id);
    expect(publicUser1Decks.length).toBe(1);
    await decksService.addPublicDeck(user1Id, publicUser1Decks[0].id);
    user1Decks = await decksService.getUserDecks(user1Id);
    expect(user1Decks.length).toBe(3);
    user2Decks = await decksService.getUserDecks(user2Id);
    expect(user2Decks.length).toBe(2);

    await decksService.publishUserDeck(user2Id, user2Deck1.id);
    publicUser1Decks = await decksService.getPublicDecks(user1Id);
    expect(publicUser1Decks.length).toBe(0);
    user1Decks = await decksService.getUserDecks(user1Id);
    expect(user1Decks.length).toBe(3);

    let errMsg;
    try {
      await decksService.addPublicDeck(user1Id, user2Deck1.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Deck doesn't exist");
  });

  it("addPublicDeck, case 2", async () => {
    const pubU1D1 = await decksService.publishUserDeck(user1Id, user1Deck1.id);
    let pub1 = await decksService.getPublicDecks(user1Id);
    expect(pub1.length).toBe(0);
    let pub2 = await decksService.getPublicDecks(user2Id);
    expect(pub2.length).toBe(1);

    let errMsg;
    try {
      await decksService.addPublicDeck(user1Id, pubU1D1.deck.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Deck is already existed in userDecks");

    try {
      await decksService.addPublicDeck(user2Id, user1Deck2.deck.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Deck cannot be added");
  });

  it("delete published user deck", async () => {
    let errMsg;
    try {
      await decksService.deleteUserDeck(user1Id, user2Deck2.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("UserDeck doesn't exist");

    let u1decks = await decksService.getUserDecks(user1Id);
    expect(u1decks.length).toBe(2);
    let pub1 = await decksService.getPublicDecks(user1Id);
    expect(pub1.length).toBe(0);
    let pub2 = await decksService.getPublicDecks(user2Id);
    expect(pub2.length).toBe(0);

    for (const ud of u1decks) {
      let d = await decksService.publishUserDeck(user1Id, ud.id);
      expect(d.published).toBe(true);
      d = await decksService.deleteUserDeck(user1Id, ud.id);
      expect(d.deleted).toBe(true);
    }

    u1decks = await decksService.getUserDecks(user1Id);
    expect(u1decks.length).toBe(0);
    pub1 = await decksService.getPublicDecks(user1Id);
    expect(pub1.length).toBe(2);
    pub2 = await decksService.getPublicDecks(user2Id);
    expect(pub2.length).toBe(2);

    for (const pud of pub1) {
      await decksService.addPublicDeck(user1Id, pud.id);
    }

    u1decks = await decksService.getUserDecks(user1Id);
    expect(u1decks.length).toBe(2);
    pub1 = await decksService.getPublicDecks(user1Id);
    expect(pub1.length).toBe(0);
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("Decks service: dynamic deck", () => {
  let userId: string;
  let userDeck1: UserDeckDTO;
  let userDeck2: UserDeckDTO;
  const tc = decksTestCases.case1;
  const buffer = getBuffer(tc.pathToFile);
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    let userEmail = String(Math.random()) + "@email.com";

    const user = await userService.createUser({
      email: userEmail,
      name: "123",
      password: "123",
    });
    userId = user.id;

    userDeck1 = await decksService.createUserDeck(userId, {
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
    userDeck2 = await decksService.createUserDeck(userId, {
      buffer,
      mimetype: "csv",
      originalname: String(Math.random()),
    });
  });

  async function getDynDeck(): Promise<UserDeckDTO | undefined> {
    const userDecks = await decksService.getUserDecks(userId);
    return userDecks.find((ud) => ud.dynamic);
  }

  it("createDynamicUserDeck", async () => {
    let dynUserDeck = await getDynDeck();
    expect(dynUserDeck).toBe(undefined);

    // @ts-ignore
    const spyNewUserDeck = jest.spyOn(DecksService.prototype, "newUserDeck");
    const spyUpdateAutoSync = jest.spyOn(
      DecksService.prototype,
      "updateAutoSync"
    );

    const userDeck = await decksService.createDynamicUserDeck(userId);
    expect(spyNewUserDeck).toBeCalled();
    expect(spyUpdateAutoSync).toBeCalled();

    let settings = await decksService.getDecksSettings(userId);
    expect(settings.dynamicAutoSync).toBe(true);

    expect(globalJobStore.userJobs.updateJob).toBeCalled();

    expect(userDeck.deck.name).toBe("Dynamic deck");
    expect(userDeck.cardsCount).toBe(0);
    expect(userDeck.cardsLearned).toBe(0);
    expect(userDeck.dynamic).toBe(true);
    expect(userDeck.enabled).toBe(true);
    expect(userDeck.deleted).toBe(false);
    settings = await decksService.getDecksSettings(userId);
    expect(userDeck.order).toBe(settings.maxOrder);

    const deck = await decksService.getDeckById(userDeck.deck.id);
    expect(deck.createdBy.id).toBe(userId);
    expect(deck.name).toBe("Dynamic deck");
    expect(deck.public).toBe(false);
    expect(deck.totalCardsCount).toBe(0);

    expect(userDeck.deck.id).toBe(deck.id);

    const cards = await cardsService.getCardsByDeckId(deck.id);
    expect(cards.length).toBe(0);

    const userDecks = await decksService.getUserDecks(userId);
    expect(userDecks).toContainEqual(userDeck);

    dynUserDeck = await getDynDeck();
    expect(dynUserDeck).toBeTruthy();

    let errMsg;
    try {
      await decksService.createDynamicUserDeck(userId);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Dynamic userDeck already exists");

    await decksService.deleteDynamicUserDeck(userId);
  });

  it("deleteDynamicUserDeck", async () => {
    let dynUserDeck = await getDynDeck();
    expect(dynUserDeck).toBe(undefined);
    await decksService.createDynamicUserDeck(userId);
    dynUserDeck = await getDynDeck();
    expect(dynUserDeck).toBeTruthy();
    let userDecks = await decksService.getUserDecks(userId);
    expect(userDecks).toContainEqual(dynUserDeck);

    await decksService.deleteDynamicUserDeck(userId);
    const settings = await decksService.getDecksSettings(userId);

    userDecks = await decksService.getUserDecks(userId);
    expect(userDecks).not.toContain(dynUserDeck);

    expect(settings.dynamicAutoSync).toBe(false);
    expect(settings.dynamicSyncType).toBe(undefined);
    expect(settings.dynamicSyncLink).toBe(undefined);
    expect(settings.dynamicSyncMessage).toBe(undefined);
    expect(settings.dynamicSyncAttempts.length).toBe(0);

    expect(globalJobStore.userJobs.cancelJob).toBeCalled();

    let errMsg;
    try {
      await decksService.deleteDynamicUserDeck(userId);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Dynamic userDeck doesn't exist");
  });

  it("deleteUserDeck", async () => {
    const dynUD = await decksService.createDynamicUserDeck(userId);
    let errMsg;
    try {
      await decksService.deleteUserDeck(userId, dynUD.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Dynamic deck is not allowed");

    await decksService.deleteDynamicUserDeck(userId);
  });

  it("syncDynamicUserDeck", async () => {
    await decksService.createDynamicUserDeck(userId);

    let errMsg;
    try {
      await decksService.syncDynamicUserDeck(userId);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("DynamicSyncType is undefined");

    await decksService.updateSyncData(
      userId,
      DynamicSyncType.reverso,
      reversoTestLink
    );

    // syncHandler -> false
    SyncClient.prototype.syncHandler = jest.fn(async () =>
      Promise.resolve([false])
    );
    let spySyncHandler = jest.spyOn(SyncClient.prototype, "syncHandler");
    let settings = await decksService.getDecksSettings(userId);
    expect(settings.dynamicAutoSync).toBe(true);
    await decksService.syncDynamicUserDeck(userId);
    expect(spySyncHandler).toBeCalled();
    expect(globalJobStore.userJobs.cancelJob).toBeCalled();
    settings = await decksService.getDecksSettings(userId);
    expect(settings.dynamicAutoSync).toBe(false);
    expect(settings.dynamicSyncMessage).toBe("Sync error");

    // syncHandler -> true
    SyncClient.prototype.syncHandler = jest.fn(async () =>
      Promise.resolve([true])
    );
    spySyncHandler = jest.spyOn(SyncClient.prototype, "syncHandler");
    await decksService.syncDynamicUserDeck(userId);
    expect(spySyncHandler).toBeCalled();

    settings = await decksService.getDecksSettings(userId);
    expect(settings.dynamicSyncMessage).toMatch("Last sync at");
    try {
      await decksService.syncDynamicUserDeck(userId);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Too many attempts. Try again later...");
    // jest.useFakeTimers();
    // jest.runAllTimers();
    await new Promise((r) => setTimeout(r, SYNC_TIMEOUT_LIMIT));

    const someError = "someError";
    SyncClient.prototype.syncHandler = jest.fn(async () =>
      Promise.resolve([false, someError])
    );
    await decksService.syncDynamicUserDeck(userId);
    settings = await decksService.getDecksSettings(userId);
    expect(settings.dynamicAutoSync).toBe(false);
    expect(settings.dynamicSyncMessage).toBe(someError);

    SyncClient.prototype.syncHandler = jest.fn(async () =>
      Promise.resolve([true])
    );
    await decksService.syncDynamicUserDeck(userId);
    expect(spySyncHandler).toBeCalled();
    settings = await decksService.getDecksSettings(userId);
    expect(settings.dynamicSyncMessage).toMatch("Last sync at");

    await decksService.deleteDynamicUserDeck(userId);
  });

  it("updateSyncDataType", async () => {
    const settings = await decksService.updateSyncData(
      userId,
      DynamicSyncType.reverso,
      reversoTestLink
    );
    expect(globalJobStore.userJobs.updateJob).toBeCalled();
    expect(settings.dynamicSyncType).toBe(DynamicSyncType.reverso);
    expect(settings.dynamicSyncLink).toBe(reversoTestLink);
  });

  it("updateAutoSync", async () => {
    let settings = await decksService.updateAutoSync(userId, false);
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
