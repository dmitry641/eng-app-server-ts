import { Document, model, Schema } from "mongoose";
import { UserId } from "../user";

export interface UserFlashcardsSettingsInput {
  user: UserId;
}

export interface IUserFlashcardsSettings
  extends UserFlashcardsSettingsInput,
    Document {
  frontSideFirst: boolean;
  randomSideFirst: boolean;
  showPictures: boolean;
}

const UserFlashcardsSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    frontSideFirst: { type: Boolean, default: true },
    randomSideFirst: { type: Boolean, default: false },
    showPictures: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserFlashcardsSettingsModel = model<IUserFlashcardsSettings>(
  "UserFlashcardsSettings",
  UserFlashcardsSettingsSchema
);
