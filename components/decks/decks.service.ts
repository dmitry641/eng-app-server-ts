import { User } from "../users/user";
import { IUserDeck, UserDeckModel } from "./models/userDecks.model";

export class UserDecksService {
  static async findUserDecks(user: User): Promise<IUserDeck[]> {
    return UserDeckModel.find({ user: user.id });
  }
}
