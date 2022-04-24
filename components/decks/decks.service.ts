import { FilterQuery } from "mongoose";
import { DeckInput, DeckModel, IDeck } from "./models/decks.model";
import {
  IUserDeck,
  UserDeckInput,
  UserDeckModel,
} from "./models/userDecks.model";

export class UserDecksService {
  static async findUserDecks(
    query: FilterQuery<IUserDeck>
  ): Promise<IUserDeck[]> {
    return UserDeckModel.find(query);
  }
  static async createUserDeck(obj: UserDeckInput): Promise<IUserDeck> {
    return UserDeckModel.create(obj);
  }
}

export class DecksService {
  static async findDecks(query: FilterQuery<IDeck>): Promise<IDeck[]> {
    return DeckModel.find(query);
  }
  static async createDeck(obj: DeckInput): Promise<IDeck> {
    return DeckModel.create(obj);
  }
}
