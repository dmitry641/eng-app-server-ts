import { Document, model, Schema } from "mongoose";

export interface UserSettingsInput {
  user: Schema.Types.ObjectId;
  darkTheme?: boolean;
}

export interface IUserSettings extends UserSettingsInput, Document {}

const UserSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    darkTheme: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserSettingsModel = model<IUserSettings>(
  "UserSettings",
  UserSettingsSchema
);
