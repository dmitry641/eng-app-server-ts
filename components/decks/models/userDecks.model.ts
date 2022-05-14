import { Document, model, Schema } from "mongoose";
import { UserId } from "../../users/user";
import { DeckId } from "../deck";

export interface UserDeckInput {
  user: UserId;
  deck: DeckId;
  order: number;
  cardsCount: number;
  dynamic: boolean;
}

export interface IUserDeck extends UserDeckInput, Document {
  enabled: boolean;
  deleted: boolean;
  cardsLearned: number;
}

const UserDeckSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deck: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
    order: { type: Number, required: true },
    cardsCount: { type: Number, required: true },
    cardsLearned: { type: Number, default: 0, required: true },
    dynamic: { type: Boolean, required: true },
    enabled: { type: Boolean, default: true, required: true },
    deleted: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

export const UserDeckModel = model<IUserDeck>("UserDeck", UserDeckSchema);
