import { Document, model, Schema } from "mongoose";
import { UserId } from "../user";

export interface UserCardsSettingsInput {
  user: UserId;
}

export interface IUserCardsSettings extends UserCardsSettingsInput, Document {
  frontSideFirst: boolean;
  randomSideFirst: boolean;
  showPictures: boolean;
}

const UserCardsSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    frontSideFirst: { type: Boolean, default: true },
    randomSideFirst: { type: Boolean, default: false },
    showPictures: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserCardsSettingsModel = model<IUserCardsSettings>(
  "UserCardsSettings",
  UserCardsSettingsSchema
);
