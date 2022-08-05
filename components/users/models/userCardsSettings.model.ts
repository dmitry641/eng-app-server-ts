import { Document, model, Schema } from "mongoose";
import { UserId } from "../user";

export interface UserCardsSettingsInput {
  user: UserId;
}

export interface IUserCardsSettings extends UserCardsSettingsInput, Document {
  dynamicHighPriority: boolean;
  showLearned: boolean;
  shuffleDecks: boolean;
  frontSideFirst: boolean;
  randomSideFirst: boolean;
}

const UserCardsSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dynamicHighPriority: { type: Boolean, default: true, required: true },
    showLearned: { type: Boolean, default: true, required: true },
    shuffleDecks: { type: Boolean, default: false, required: true },
    frontSideFirst: { type: Boolean, default: true, required: true },
    randomSideFirst: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

export const UserCardsSettingsModel = model<IUserCardsSettings>(
  "UserCardsSettings",
  UserCardsSettingsSchema
);
