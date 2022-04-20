import {
  IUserDeckSettings,
  UserDeckSettingsModel,
} from "./models/userDecksSettings.model";
import { User } from "./user";

export class UserDecksSettingsService {
  static async findUserDecksSettings(
    user: User
  ): Promise<IUserDeckSettings | null> {
    return UserDeckSettingsModel.findOne({ user: user.id });
  }
}
