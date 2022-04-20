import { Document, model, Schema } from "mongoose";

export interface IUserDeck extends Document {
  user: Schema.Types.ObjectId;
  deck: Schema.Types.ObjectId;
  dynamic: boolean;
  enabled: boolean;
  order: number;
  deleted: boolean;
  wordsCount: number;
  wordsLearned: number;
}

const UserDeckSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    deck: { type: Schema.Types.ObjectId, ref: "Deck" },
    dynamic: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    order: { type: Number, required: true },
    deleted: { type: Boolean, default: false },
    wordsCount: { type: Number, default: 0 },
    wordsLearned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserDeckModel = model<IUserDeck>("UserDeck", UserDeckSchema);
