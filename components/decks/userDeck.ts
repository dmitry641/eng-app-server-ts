import { ObjId } from "../../utils/types";
import { User, UserDecksSettings, UserId } from "../users/user";
import { UserDecksService } from "./decks.service";
import { IUserDeck } from "./models/userDecks.model";

class UserDecksStore {
  private userDecksClients = new Map<UserId, UserDecksClient>();
  async getUserDecksClient(user: User): Promise<UserDecksClient> {
    // Нарушение принципов. Гет и сет в одном месте.
    let userDecksClient;
    userDecksClient = this.userDecksClients.get(user.id);
    if (userDecksClient) return userDecksClient;

    const userDecks = await this.getUserDecks(user);
    userDecksClient = new UserDecksClient(userDecks, user);

    this.userDecksClients.set(user.id, userDecksClient);
    return userDecksClient;
  }
  private async getUserDecks(user: User): Promise<UserDeck[]> {
    let userDecks: UserDeck[] = [];
    const models = await UserDecksService.findUserDecks(user);

    for (let model of models) {
      const userDeck = new UserDeck(model);
      userDecks.push(userDeck);
    }

    return userDecks;
  }
}
export const globalUserDecksStore = new UserDecksStore();

class UserDecksClient {
  private settings: UserDecksSettings;
  constructor(private decks: UserDeck[], private user: User) {
    this.settings = user.settings.decksSettings;
  }
}

export type UserDeckId = ObjId;
class UserDeck {
  id: UserDeckId;
  private _userdeck: IUserDeck;
  constructor(userdeck: IUserDeck) {
    this.id = userdeck._id;
    this._userdeck = userdeck;
  }
}
