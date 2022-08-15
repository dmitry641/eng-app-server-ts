import { Document, model, Schema } from "mongoose";
import { IUser } from "../../users/models/users.model";

export interface CardsSettingsInput {
  user: IUser["_id"];
}

export interface ICardsSettings extends CardsSettingsInput, Document {
  dynamicHighPriority: boolean;
  showLearned: boolean;
  shuffleDecks: boolean;
  frontSideFirst: boolean;
  randomSideFirst: boolean;
}

const CardsSettingsSchema: Schema = new Schema(
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

export const CardsSettingsModel = model<ICardsSettings>(
  "CardsSettings",
  CardsSettingsSchema
);
