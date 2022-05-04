import bcrypt from "bcrypt";
import { StripeUtil } from "../../utils/stripe.util";
import { ObjId } from "../../utils/types";
import { IUserCardsSettings } from "./models/userCardsSettings.model";
import { IUserDecksSettings } from "./models/userDecksSettings.model";
import { IUserPhoneSettings } from "./models/userPhoneSettings.model";
import { IUser } from "./models/users.model";
import { IUserSettings, UserSettingsInput } from "./models/userSettings.model";
import { DynamicSyncData, DynamicSyncType } from "./user.util";
import { CreateUserDto } from "./users.dto";
import {
  UserCardsSettingsService,
  UserDecksSettingsService,
  UserPhoneSettingsService,
  UserService,
  UserSettingsService,
} from "./users.service";

class UserStore {
  private users: User[] = [];
  async getUser(userId: UserId): Promise<User> {
    let user: User | undefined;
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
  private async initUser(userId: UserId): Promise<User | undefined> {
    const dbUser = await UserService.findOneUser({ _id: userId });
    if (!dbUser) return undefined; // throw new Error("User not found")
    const settings = await this.findUserSettings(userId);
    if (!settings) return undefined; // throw new Error("UserSettings not found")
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
    const dbCardsSettings: IUserCardsSettings =
      await UserCardsSettingsService.createUserCardsSettings({
        user,
      });
    const flashcardsSettings: UserCardsSettings = new UserCardsSettings(
      dbCardsSettings
    );

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

    const dbCardsSettings =
      await UserCardsSettingsService.findOneUserCardsSettings({
        user: userId,
      });
    if (!dbCardsSettings) return null;
    const cardsSettings: UserCardsSettings = new UserCardsSettings(
      dbCardsSettings
    );

    const settings = new UserSettings(
      dbSettings,
      phoneSettings,
      decksSettings,
      cardsSettings
    );
    return settings;
  }
}

export type UserId = ObjId;
export class User {
  readonly id: UserId;
  private _user: IUser;
  readonly settings: UserSettings;
  // subscriprion
  constructor(user: IUser, settings: UserSettings) {
    this.id = user._id;
    this._user = user;
    this.settings = settings;
  }
}

export class UserSettings {
  constructor(
    private _settings: IUserSettings,
    public readonly phoneSettings: UserPhoneSettings,
    public readonly userDecksSettings: UserDecksSettings,
    public readonly userCardsSettings: UserCardsSettings
  ) {}
}

export class UserPhoneSettings {
  private _settings: IUserPhoneSettings;
  constructor(settings: IUserPhoneSettings) {
    this._settings = settings;
  }
}
export class UserDecksSettings {
  private _settings: IUserDecksSettings;
  private maxOrder: number;
  private dynamicSyncType?: IUserDecksSettings["dynamicSyncType"];
  private dynamicSyncData?: IUserDecksSettings["dynamicSyncData"];
  private dynamicAutoSync?: boolean;
  private dynamicSyncMessage?: IUserDecksSettings["dynamicSyncMessage"];
  private dynamicSyncAttempts: number[] = [];
  constructor(settings: IUserDecksSettings) {
    this._settings = settings;
    this.maxOrder = settings.maxOrder;
    this.dynamicSyncType = settings.dynamicSyncType;
    this.dynamicSyncData = settings.dynamicSyncData;
    this.dynamicAutoSync = settings.dynamicAutoSync;
    this.dynamicSyncMessage = settings.dynamicSyncMessage;
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
  getDynamicSyncType() {
    return this.dynamicSyncType;
  }
  async setDynamicSyncType(
    type: DynamicSyncType | undefined
  ): Promise<UserDecksSettings> {
    this.dynamicSyncType = type;
    this._settings.dynamicSyncType = type;
    this._settings.save();
    return this;
  }
  getDynamicSyncData() {
    return this.dynamicSyncData;
  }
  async setDynamicSyncData(
    data: DynamicSyncData | undefined
  ): Promise<UserDecksSettings> {
    this.dynamicSyncData = data;
    this._settings.dynamicSyncData = data;
    this._settings.save();
    return this;
  }
  getDynamicAutoSync() {
    return this.dynamicAutoSync;
  }
  async setDynamicAutoSync(value: boolean): Promise<UserDecksSettings> {
    this.dynamicAutoSync = value;
    this._settings.dynamicAutoSync = value;
    this._settings.save();
    return this;
  }
  getDynamicSyncMessage() {
    return this.dynamicSyncMessage;
  }
  async setDynamicSyncMessage(
    msg: string | undefined
  ): Promise<UserDecksSettings> {
    this.dynamicSyncMessage = msg;
    this._settings.dynamicSyncMessage = msg;
    this._settings.save();
    return this;
  }
  getDynamicSyncAttempts() {
    return this.dynamicSyncAttempts;
  }
  getLastDynamicSyncAttempt() {
    return this.dynamicSyncAttempts.at(-1);
  }
  setDynamicSyncAttempts(arr: number[]): UserDecksSettings {
    this.dynamicSyncAttempts = arr;
    return this;
  }
  appendDynamicSyncAttempt(value: number): UserDecksSettings {
    this.dynamicSyncAttempts.push(value);
    return this;
  }
}
export class UserCardsSettings {
  private _settings: IUserCardsSettings;
  private _dynamicHighPriority: boolean;
  private _shuffleDecks: boolean;
  constructor(settings: IUserCardsSettings) {
    this._settings = settings;
    this._dynamicHighPriority = settings.dynamicHighPriority;
    this._shuffleDecks = settings.shuffleDecks;
  }
  get dynamicHighPriority() {
    return this._dynamicHighPriority;
  }
  get shuffleDecks() {
    return this._shuffleDecks;
  }
}

export const globalUserStore = new UserStore();
