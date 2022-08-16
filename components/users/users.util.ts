import { CookieOptions } from "express";
import { ISession } from "./models/sessions.model";
import { IUser, UserInput } from "./models/users.model";
import { IUserSettings, UserSettingsInput } from "./models/userSettings.model";

export type UserId = string;
export const COOKIE_NAME: string = "engApp";
export const COOKIE_OPTIONS: CookieOptions = {
  maxAge: 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
  sameSite: "lax", // FIXME: разобраться
};

export enum UpdUserSettingsEnum {
  darkMode = "darkMode",
}
export type UpdUserSettingsType = {
  type: UpdUserSettingsEnum;
  value: boolean;
};

export type CreateUserDTO = Omit<UserInput, "stripeCustomerId"> &
  Partial<Omit<UserSettingsInput, "user">>;

export type LogInDTO = { email: string; password: string };

// PrivateUserDTO = Omit<UserDTO, 'email'> + overload in service
export class UserDTO {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  constructor(user: IUser) {
    this.id = String(user._id);
    this.name = user.name;
    this.email = user.email;
  }
}
export class UserSettingsDTO {
  readonly darkMode: boolean;
  constructor(settings: IUserSettings) {
    this.darkMode = settings.darkMode;
  }
}

export class SessionDTO {
  readonly id: string;
  readonly userAgent: string;
  readonly ip: string;
  constructor(session: ISession) {
    this.id = String(session._id);
    this.userAgent = session.userAgent;
    this.ip = session.ip;
  }
}
