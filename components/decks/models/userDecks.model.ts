import { Document, model, Schema } from "mongoose";
import { IUser } from "../../users/models/users.model";
import { IDeck } from "./decks.model";

export interface UserDeckInput {
  user: IUser["_id"];
  deck: IDeck["_id"];
  order: number;
  cardsCount: number;
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
    enabled: { type: Boolean, default: true, required: true },
    deleted: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

export const UserDeckModel = model<IUserDeck>("UserDeck", UserDeckSchema);
