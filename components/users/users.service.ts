import { FilterQuery } from "mongoose";
import {
  IUserDecksSettings,
  UserDecksSettingsInput,
  UserDecksSettingsModel,
} from "./models/userDecksSettings.model";
import {
  IUserFlashcardsSettings,
  UserFlashcardsSettingsInput,
  UserFlashcardsSettingsModel,
} from "./models/userFlashcardsSettings.model";
import {
  IUserPhoneSettings,
  UserPhoneSettingsInput,
  UserPhoneSettingsModel,
} from "./models/userPhoneSettings.model";
import { IUser, UserInput, UserModel } from "./models/users.model";
import {
  IUserSettings,
  UserSettingsInput,
  UserSettingsModel,
} from "./models/userSettings.model";

export class UserService {
  static async findOneUser(query: FilterQuery<IUser>): Promise<IUser | null> {
    return UserModel.findOne(query);
  }
  static async createUser(obj: UserInput): Promise<IUser> {
    return UserModel.create(obj);
  }
}

export class UserSettingsService {
  static async createUserSettings(
    obj: UserSettingsInput
  ): Promise<IUserSettings> {
    return UserSettingsModel.create(obj);
  }
  static async findOneUserSettings(
    query: FilterQuery<IUserSettings>
  ): Promise<IUserSettings | null> {
    return UserSettingsModel.findOne(query);
  }
}

export class UserPhoneSettingsService {
  static async createUserPhoneSettings(
    obj: UserPhoneSettingsInput
  ): Promise<IUserPhoneSettings> {
    return UserPhoneSettingsModel.create(obj);
  }
  static async findOneUserPhoneSettings(
    query: FilterQuery<IUserPhoneSettings>
  ): Promise<IUserPhoneSettings | null> {
    return UserPhoneSettingsModel.findOne(query);
  }
}

export class UserDecksSettingsService {
  static async createUserDecksSettings(
    obj: UserDecksSettingsInput
  ): Promise<IUserDecksSettings> {
    return UserDecksSettingsModel.create(obj);
  }
  static async findOneUserDecksSettings(
    query: FilterQuery<IUserDecksSettings>
  ): Promise<IUserDecksSettings | null> {
    return UserDecksSettingsModel.findOne(query);
  }
}

export class UserFlashcardsSettingsService {
  static async createUserFlashcardsSettings(
    obj: UserFlashcardsSettingsInput
  ): Promise<IUserFlashcardsSettings> {
    return UserFlashcardsSettingsModel.create(obj);
  }
  static async findOneUserFlashcardsSettings(
    query: FilterQuery<IUserFlashcardsSettings>
  ): Promise<IUserFlashcardsSettings | null> {
    return UserFlashcardsSettingsModel.findOne(query);
  }
}
