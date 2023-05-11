import { Document, model, Schema } from "mongoose";
import { IUser } from "../../users/models/users.model";

export interface CardsSettingsInput {
  user: IUser["_id"];
}

export interface ICardsSettings extends CardsSettingsInput, Document {
  showLearned: boolean;
  shuffleDecks: boolean;
}

const CardsSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    showLearned: { type: Boolean, default: true, required: true },
    shuffleDecks: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

export const CardsSettingsModel = model<ICardsSettings>(
  "CardsSettings",
  CardsSettingsSchema
);
