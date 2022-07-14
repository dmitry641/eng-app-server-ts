import bcrypt from "bcrypt";
import { StripeUtil } from "../../utils/stripe.util";
import { IUserCardsSettings } from "./models/userCardsSettings.model";
import { IUserDecksSettings } from "./models/userDecksSettings.model";
import { IUserPhoneSettings } from "./models/userPhoneSettings.model";
import { IUser } from "./models/users.model";
import { IUserSettings, UserSettingsInput } from "./models/userSettings.model";
import { DynamicSyncData, DynamicSyncType } from "./user.util";
import { CreateUserDTO } from "./users.dto";
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
  }: CreateUserDTO): Promise<User> {
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
    const userSettings: UserSettings = await this.createUserSettings({
      user: String(dbUser._id),
    });
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

export type UserId = string;
export class User {
  readonly id: UserId;
  private _user: IUser;
  readonly settings: UserSettings;
  // subscriprion
  constructor(user: IUser, settings: UserSettings) {
    this.id = String(user._id);
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
  private _maxOrder: number;
  private _dynamicSyncType?: IUserDecksSettings["dynamicSyncType"];
  private _dynamicSyncData?: IUserDecksSettings["dynamicSyncData"];
  private _dynamicAutoSync: boolean;
  private _dynamicSyncMessage?: IUserDecksSettings["dynamicSyncMessage"];
  private _dynamicSyncAttempts: number[] = [];
  constructor(settings: IUserDecksSettings) {
    this._settings = settings;
    this._maxOrder = settings.maxOrder;
    this._dynamicSyncType = settings.dynamicSyncType;
    this._dynamicSyncData = settings.dynamicSyncData;
    this._dynamicAutoSync = settings.dynamicAutoSync;
    this._dynamicSyncMessage = settings.dynamicSyncMessage;
  }
  get maxOrder() {
    return this._maxOrder;
  }
  async setMaxOrder(num: number): Promise<UserDecksSettings> {
    this._maxOrder = num;
    this._settings.maxOrder = num;
    await this._settings.save(); // спорный момент
    return this;
  }
  get dynamicSyncType() {
    return this._dynamicSyncType;
  }
  async setDynamicSyncType(
    type: DynamicSyncType | undefined
  ): Promise<UserDecksSettings> {
    this._dynamicSyncType = type;
    this._settings.dynamicSyncType = type;
    await this._settings.save();
    return this;
  }
  get dynamicSyncData() {
    return this._dynamicSyncData;
  }
  async setDynamicSyncData(
    data: DynamicSyncData | undefined
  ): Promise<UserDecksSettings> {
    this._dynamicSyncData = data;
    this._settings.dynamicSyncData = data;
    await this._settings.save();
    return this;
  }
  get dynamicAutoSync() {
    return this._dynamicAutoSync;
  }
  async setDynamicAutoSync(value: boolean): Promise<UserDecksSettings> {
    this._dynamicAutoSync = value;
    this._settings.dynamicAutoSync = value;
    await this._settings.save();
    return this;
  }
  get dynamicSyncMessage() {
    return this._dynamicSyncMessage;
  }
  async setDynamicSyncMessage(
    msg: string | undefined
  ): Promise<UserDecksSettings> {
    this._dynamicSyncMessage = msg;
    this._settings.dynamicSyncMessage = msg;
    await this._settings.save();
    return this;
  }
  get dynamicSyncAttempts() {
    return this._dynamicSyncAttempts;
  }
  getLastDynamicSyncAttempt() {
    return this._dynamicSyncAttempts.at(-1);
  }
  setDynamicSyncAttempts(arr: number[]): UserDecksSettings {
    this._dynamicSyncAttempts = arr;
    return this;
  }
  appendDynamicSyncAttempt(value: number): UserDecksSettings {
    this._dynamicSyncAttempts.push(value);
    return this;
  }
}
export class UserDecksSettingsDTO {
  readonly maxOrder: number;
  readonly dynamicSyncType?: IUserDecksSettings["dynamicSyncType"];
  readonly dynamicSyncData?: IUserDecksSettings["dynamicSyncData"];
  readonly dynamicAutoSync: boolean;
  readonly dynamicSyncMessage?: string;
  readonly dynamicSyncAttempts: number[] = [];
  constructor(settings: UserDecksSettings) {
    this.maxOrder = settings.maxOrder;
    this.dynamicSyncType = settings.dynamicSyncType;
    this.dynamicSyncData = settings.dynamicSyncData;
    this.dynamicAutoSync = settings.dynamicAutoSync;
    this.dynamicSyncMessage = settings.dynamicSyncMessage;
  }
}

export class UserCardsSettings {
  private _settings: IUserCardsSettings;
  private _dynamicHighPriority: boolean;
  private _showLearned: boolean;
  private _shuffleDecks: boolean;
  constructor(settings: IUserCardsSettings) {
    this._settings = settings;
    this._dynamicHighPriority = settings.dynamicHighPriority;
    this._shuffleDecks = settings.shuffleDecks;
    this._showLearned = settings.showLearned;
  }
  get dynamicHighPriority() {
    return this._dynamicHighPriority;
  }
  async setDynamicHighPriority(value: boolean) {
    this._dynamicHighPriority = value;
    this._settings.dynamicHighPriority = value;
    await this._settings.save();
    return this;
  }
  get showLearned() {
    return this._showLearned;
  }
  async setShowLearned(value: boolean) {
    this._showLearned = value;
    this._settings.showLearned = value;
    await this._settings.save();
    return this;
  }
  get shuffleDecks() {
    return this._shuffleDecks;
  }
  async setShuffleDecks(value: boolean) {
    this._shuffleDecks = value;
    this._settings.shuffleDecks = value;
    await this._settings.save();
    return this;
  }
}
export class UserCardsSettingsDTO {
  readonly dynamicHighPriority: boolean;
  readonly shuffleDecks: boolean;
  constructor(settings: UserCardsSettings) {
    this.dynamicHighPriority = settings.dynamicHighPriority;
    this.shuffleDecks = settings.shuffleDecks;
  }
}

export const globalUserStore = new UserStore();
