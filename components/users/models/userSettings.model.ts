import { Document, model, Schema } from "mongoose";
import { IUser } from "./users.model";

export interface UserSettingsInput {
  user: IUser["_id"];
  darkMode?: boolean;
}

export interface IUserSettings extends Required<UserSettingsInput>, Document {}

const UserSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    darkMode: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const UserSettingsModel = model<IUserSettings>(
  "UserSettings",
  UserSettingsSchema
);
