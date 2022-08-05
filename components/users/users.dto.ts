import { ISession } from "./models/sessions.model";
import { UserInput } from "./models/users.model";
import { UserSettingsInput } from "./models/userSettings.model";
import { User } from "./user";

export type CreateUserDTO = Omit<UserInput, "stripeCustomerId"> &
  Partial<Omit<UserSettingsInput, "user">>;

export type LogInDTO = { email: string; password: string };

export class UserDTO {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  constructor(user: User) {
    this.id = String(user.id);
    this.name = user.name;
    this.email = user.email;
  }
}
export class UserSettingsDTO {
  readonly darkMode: boolean;
  constructor(user: User) {
    this.darkMode = user.settings.darkMode;
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
