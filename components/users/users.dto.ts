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
