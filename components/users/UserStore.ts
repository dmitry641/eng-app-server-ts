import { IUser } from "./users.model";

class UserStore {
  // users: User[];
  createUser(): number {
    return 1;
  }
}

export const userStore = new UserStore();
