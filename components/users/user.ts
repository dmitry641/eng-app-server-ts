import { ObjId } from "../../utils/types";
import { IUserDeckSettings } from "./models/userDecksSettings.model";
import { IUserFlashcardsSettings } from "./models/userFlashcardsSettings.model";
import { IUserPhoneSettings } from "./models/userPhoneSettings.model";
import { IUser } from "./models/users.model";
import { IUserSettings } from "./models/userSettings.model";

class UserStore {
  private users: User[] = [];
  createUser(): number {
    return 1;
  }
  // private async getUserDecksSettings(user: User): Promise<UserDecksSettings> {
  //   // Снова нарушение принципов. Find и Create в одном месте.
  //   const model = await UserDecksSettingsService.findUserDecksSettings(user);
  //   if (!model) throw new Error(""); // create
  //   const uds = new UserDecksSettings(model);
  //   return uds;
  // }
}

export type UserId = ObjId;
export class User {
  id: UserId;
  private _user: IUser;
  settings: UserSettings;
  // subscriprion
  constructor(user: IUser, settings: UserSettings) {
    this.id = user._id;
    this._user = user;
    this.settings = settings;
  }
}

class UserSettings {
  constructor(
    private _settings: IUserSettings,
    public decksSettings: UserDecksSettings,
    public flashcardsSettings: UserFlashcardsSettings,
    public phoneSettings: UserPhoneSettings
  ) {}
}

class UserPhoneSettings {
  private _settings: IUserPhoneSettings;
  constructor(settings: IUserPhoneSettings) {
    this._settings = settings;
  }
}
export class UserDecksSettings {
  private _settings: IUserDeckSettings;
  constructor(settings: IUserDeckSettings) {
    this._settings = settings;
  }
}
export class UserFlashcardsSettings {
  private _settings: IUserFlashcardsSettings;
  constructor(settings: IUserFlashcardsSettings) {
    this._settings = settings;
  }
}

export const userStore = new UserStore();
