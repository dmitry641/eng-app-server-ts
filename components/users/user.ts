import { ObjId } from "../../utils/types";
import { IUser } from "./models/users.model";

class UserStore {
  users: User[] = [];
  createUser(): number {
    return 1;
  }
}

type UserId = ObjId;

class User {
  id: UserId;
  private user: IUser;
  // private settings:
  // private phoneSettings;
  // private subscriprion
  constructor(userFromDB: IUser) {
    this.id = userFromDB._id;
    this.user = userFromDB;
  }
}

export const userStore = new UserStore();
