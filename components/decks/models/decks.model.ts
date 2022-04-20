import { Document, model, Schema } from "mongoose";

export interface IDeck extends Document {
  name: string;
  totalWordsCount: number;
}

const DeckSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    totalWordsCount: { type: Number },
  },
  { timestamps: true }
);

export const DeckModel = model<IDeck>("Deck", DeckSchema);
