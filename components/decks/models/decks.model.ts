import { Document, model, Schema } from "mongoose";
import { IUser } from "../../users/models/users.model";

export interface DeckInput {
  createdBy: IUser["_id"];
  name: string;
  totalCardsCount: number;
}

export interface IDeck extends DeckInput, Document {
  public: boolean;
}

const DeckSchema: Schema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    totalCardsCount: { type: Number, required: true },
    public: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

export const DeckModel = model<IDeck>("Deck", DeckSchema);
