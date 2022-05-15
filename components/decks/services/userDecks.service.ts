import { FilterQuery } from "mongoose";
import {
  IUserDeck,
  UserDeckInput,
  UserDeckModel,
} from "../models/userDecks.model";

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
