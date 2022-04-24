import { UserInput } from "./models/users.model";
import { UserSettingsInput } from "./models/userSettings.model";

export type CreateUserDto = Omit<UserInput, "stripeCustomerId"> &
  Partial<Omit<UserSettingsInput, "user">>;