import bcrypt from "bcrypt";
import { StripeUtil } from "../../utils/stripe.util";
import { ObjId } from "../../utils/types";
import { IUserDecksSettings } from "./models/userDecksSettings.model";
import { IUserFlashcardsSettings } from "./models/userFlashcardsSettings.model";
import { IUserPhoneSettings } from "./models/userPhoneSettings.model";
import { IUser } from "./models/users.model";
import { IUserSettings, UserSettingsInput } from "./models/userSettings.model";
import { CreateUserDto } from "./users.dto";
import {
  UserDecksSettingsService,
  UserFlashcardsSettingsService,
  UserPhoneSettingsService,
  UserService,
  UserSettingsService,
} from "./users.service";

class UserStore {
  private users: User[] = [];
  getUser() {
    // map find
    // service find??? + init
    // else throw new Error("User doesn't exist")
  }
  async createUser({
    email,
    name,
    password,
    ...rest
  }: CreateUserDto): Promise<User> {
    const emailTaken = await this.isEmailTaken(email);
    if (emailTaken) throw new Error("This email address is already in use");

    const stripeUser = await StripeUtil.createUser({ email, name });
    const hashedPassword = await bcrypt.hash(password, 5);
    const dbUser: IUser = await UserService.createUser({
      email,
      name,
      password: hashedPassword,
      stripeCustomerId: stripeUser.id,
    });
    const userSettings: UserSettings = await this.createUserSettings(
      dbUser._id
    );
    const newUser = new User(dbUser, userSettings);
    return newUser;
  }

  private async isEmailTaken(email: string): Promise<boolean> {
    const candidate = await UserService.findOneUser({ email });
    if (candidate) return true;
    return false;
  }
  private async createUserSettings({
    user,
  }: UserSettingsInput): Promise<UserSettings> {
    const dbSettings: IUserSettings =
      await UserSettingsService.createUserSettings({ user });
    const dbPhoneSettings: IUserPhoneSettings =
      await UserPhoneSettingsService.createUserPhoneSettings({ user });
    const phoneSettings: UserPhoneSettings = new UserPhoneSettings(
      dbPhoneSettings
    );
    const dbDecksSettings: IUserDecksSettings =
      await UserDecksSettingsService.createUserDecksSettings({ user });
    const decksSettings: UserDecksSettings = new UserDecksSettings(
      dbDecksSettings
    );
    const dbFlashcardsSettings: IUserFlashcardsSettings =
      await UserFlashcardsSettingsService.createUserFlashcardsSettings({
        user,
      });
    const flashcardsSettings: UserFlashcardsSettings =
      new UserFlashcardsSettings(dbFlashcardsSettings);

    const settings = new UserSettings(
      dbSettings,
      phoneSettings,
      decksSettings,
      flashcardsSettings
    );
    return settings;
  }
  // private async getUserDecksSettings(user: IUser): Promise<UserDecksSettings> {
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
    public phoneSettings: UserPhoneSettings,
    public decksSettings: UserDecksSettings,
    public flashcardsSettings: UserFlashcardsSettings
  ) {}
}

class UserPhoneSettings {
  private _settings: IUserPhoneSettings;
  constructor(settings: IUserPhoneSettings) {
    this._settings = settings;
  }
}
export class UserDecksSettings {
  private _settings: IUserDecksSettings;
  constructor(settings: IUserDecksSettings) {
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
