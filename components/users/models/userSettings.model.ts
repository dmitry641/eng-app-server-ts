import { Document, model, Schema } from "mongoose";

export interface IUserSettings extends Document {
  user: Schema.Types.ObjectId;
  darkTheme: boolean;
}

const UserSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    darkTheme: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserSettingsModel = model<IUserSettings>(
  "UserSettings",
  UserSettingsSchema
);
