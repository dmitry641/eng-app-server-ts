import { Document, model, Schema } from "mongoose";
import { UserId } from "../../users/user";

export interface DeckInput {
  createdBy: UserId;
  name: string;
  totalCardsCount: number;
  canBePublic: boolean;
}

export interface IDeck extends DeckInput, Document {
  public: boolean;
}

const DeckSchema: Schema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    totalCardsCount: { type: Number, required: true },
    canBePublic: { type: Boolean, required: true },
    public: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

export const DeckModel = model<IDeck>("Deck", DeckSchema);
