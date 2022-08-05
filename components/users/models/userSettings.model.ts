import { Document, model, Schema } from "mongoose";
import { UserId } from "../user";

export interface UserSettingsInput {
  user: UserId;
  darkMode: boolean;
}

export interface IUserSettings extends UserSettingsInput, Document {}

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
