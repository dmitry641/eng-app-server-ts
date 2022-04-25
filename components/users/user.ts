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
  async getUser(userId: UserId): Promise<User> {
    let user;
    user = this.getUserFromStore(userId);
    if (user) return user;
    user = await this.initUser(userId);
    if (user) return user;
    throw new Error("User doesn't exist");
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
    this.addUserToStore(newUser);
    return newUser;
  }
  private async initUser(userId: UserId): Promise<User | null> {
    const dbUser = await UserService.findOneUser({ _id: userId });
    if (!dbUser) return null; // throw new Error("User not found")
    const settings = await this.findUserSettings(userId);
    if (!settings) return null; // throw new Error("User not found")
    const user = new User(dbUser, settings);
    this.addUserToStore(user);
    return user;
  }
  private addUserToStore(user: User) {
    this.users.push(user);
  }
  private getUserFromStore(userId: UserId): User | undefined {
    return this.users.find((u) => u.id === userId);
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
  private async findUserSettings(userId: UserId): Promise<UserSettings | null> {
    // Была мысль о сознательном нарушение принципов.
    // Find и Create сделать в одном месте.

    const dbSettings = await UserSettingsService.findOneUserSettings({
      user: userId,
    });
    if (!dbSettings) return null;

    const dbPhoneSettings =
      await UserPhoneSettingsService.findOneUserPhoneSettings({ user: userId });
    if (!dbPhoneSettings) return null;
    const phoneSettings: UserPhoneSettings = new UserPhoneSettings(
      dbPhoneSettings
    );

    const dbDecksSettings =
      await UserDecksSettingsService.findOneUserDecksSettings({ user: userId });
    if (!dbDecksSettings) return null;
    const decksSettings: UserDecksSettings = new UserDecksSettings(
      dbDecksSettings
    );

    const dbFlashcardsSettings =
      await UserFlashcardsSettingsService.findOneUserFlashcardsSettings({
        user: userId,
      });
    if (!dbFlashcardsSettings) return null;
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
  private maxOrder: number;
  private _settings: IUserDecksSettings;
  constructor(settings: IUserDecksSettings) {
    this._settings = settings;
    this.maxOrder = settings.maxOrder;
  }
  getMaxOrder() {
    return this.maxOrder;
  }
  async setMaxOrder(num: number): Promise<UserDecksSettings> {
    this.maxOrder = num;
    this._settings.maxOrder = num;
    this._settings.save(); // спорный момент
    return this;
  }
}
export class UserFlashcardsSettings {
  private _settings: IUserFlashcardsSettings;
  constructor(settings: IUserFlashcardsSettings) {
    this._settings = settings;
  }
}

export const userStore = new UserStore();
