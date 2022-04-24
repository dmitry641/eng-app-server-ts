import { FilterQuery } from "mongoose";
import { IUserDeck, UserDeckModel } from "./models/userDecks.model";

export class UserDecksService {
  static async findUserDecks(
    query: FilterQuery<IUserDeck>
  ): Promise<IUserDeck[]> {
    return UserDeckModel.find(query);
  }
}
