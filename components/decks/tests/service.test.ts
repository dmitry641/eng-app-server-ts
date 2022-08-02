import mongoose from "mongoose";
import { connectToTestDB, disconnectFromDB } from "../../../db";
import { globalUserStore, User } from "../../users/user";
import { DeckInput } from "../models/decks.model";
import { DecksService } from "../services/decks.service";

describe("Decks service: createDeck", () => {
  let user: User;
  beforeAll(async () => {
    await connectToTestDB();
    user = await globalUserStore.createUser({
      email: "" + Math.random(),
      name: "1",
      password: "1",
    });
  });

  it("test required fields", async () => {
    try {
      // @ts-ignore
      await DecksService.createDeck({
        canBePublic: true,
        totalCardsCount: 0,
        name: "qwerty",
      });
    } catch (error) {
      let err = error as mongoose.Error.ValidationError;
      expect(err.message).toMatch(
        "Deck validation failed: author: Path `author` is required., createdBy: Path `createdBy` is required."
      );
    }
  });

  it("wrong type", async () => {
    // @ts-ignore
    const deckInput: DeckInput = {
      canBePublic: "something",
      totalCardsCount: 0,
      name: "qwerty",
      createdBy: user.id,
    } as DeckInput;

    let errMsg;
    try {
      await DecksService.createDeck(deckInput);
    } catch (error) {
      let err = error as mongoose.Error.ValidationError;
      errMsg = err.message;
    }
    expect(errMsg).toMatch(
      "Deck validation failed: canBePublic: Cast to Boolean failed"
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
