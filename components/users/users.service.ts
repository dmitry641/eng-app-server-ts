import bcrypt from "bcrypt";
import { StripeUtil } from "../../utils/stripe.util";
import {
  DecksSettingsInput,
  DecksSettingsModel,
} from "../decks/models/decksSettings.model";
import {
  CardsSettingsInput,
  CardsSettingsModel,
} from "../flashcards/models/CardsSettings.model";
import { IUser, UserInput, UserModel } from "./models/users.model";
import {
  IUserSettings,
  UserSettingsInput,
  UserSettingsModel,
} from "./models/userSettings.model";
import {
  CreateUserDTO,
  LogInDTO,
  UpdUserSettingsEnum,
  UpdUserSettingsType,
  UserDTO,
  UserSettingsDTO,
} from "./users.util";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
    }
  }
}

class UserService {
  async createUser({
    email,
    name,
    password,
    ...rest
  }: CreateUserDTO): Promise<UserDTO> {
    const emailTaken = await this.isEmailTaken(email);
    if (emailTaken) throw new Error("This email address is already in use");

    const stripeUser = await StripeUtil.createUser({ email, name });
    const hashedPassword = await bcrypt.hash(password, 5);
    const userInput: UserInput = {
      email,
      name,
      password: hashedPassword,
      stripeCustomerId: stripeUser.id,
    };
    const user = await UserModel.create(userInput);

    await this.afterUserCreation(user);

    return this.userToDTO(user);
  }
  async validateUser({ email, password }: LogInDTO): Promise<UserDTO> {
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("Invalid email");
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Invalid password");
    return this.userToDTO(user);
  }
  async getUser(userId: string): Promise<UserDTO> {
    const user = await UserModel.findOne({ _id: userId });
    if (!user) throw new Error("User doesn't exist");
    return this.userToDTO(user);
  }
  async getSettings(userId: string): Promise<UserSettingsDTO> {
    const settings = await UserSettingsModel.findOne({ user: userId });
    if (!settings) throw new Error("UserSettings doesn't exist");
    return this.settingsToDTO(settings);
  }
  async updateSetting(
    userId: string,
    { type, value }: UpdUserSettingsType
  ): Promise<UserSettingsDTO> {
    const settings = await UserSettingsModel.findOne({ user: userId });
    if (!settings) throw new Error("UserSettings doesn't exist");

    switch (type) {
      case UpdUserSettingsEnum.darkMode:
        settings.darkMode = value;
        break;
      default:
        throw new Error("Wrong type");
    }
    await settings.save();

    return this.settingsToDTO(settings);
  }

  private async afterUserCreation(user: IUser) {
    const userSettingsInput: UserSettingsInput = {
      user: String(user._id),
      darkMode: true, // FIXME
    };
    await UserSettingsModel.create(userSettingsInput);

    const decksSettingsInput: DecksSettingsInput = {
      user: String(user.id),
    };
    await DecksSettingsModel.create(decksSettingsInput);

    const cardsSettingsInput: CardsSettingsInput = {
      user: String(user.id),
    };
    await CardsSettingsModel.create(cardsSettingsInput);
  }
  private async isEmailTaken(email: string): Promise<boolean> {
    const candidate = await UserModel.find({ email });
    if (candidate) return true;
    return false;
  }
  private userToDTO(user: IUser): UserDTO {
    return new UserDTO(user);
  }
  private settingsToDTO(settings: IUserSettings): UserSettingsDTO {
    return new UserSettingsDTO(settings);
  }
}

export const userService = new UserService();
