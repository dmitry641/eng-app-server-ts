import { Document, model, Schema } from "mongoose";
import { DeckId } from "../../decks/deck";

export const cardsCsvHeaders = [
  "srcLang",
  "trgLang",
  "srcText",
  "trgText",
] as const;
export type CardsKeysType = { [K in typeof cardsCsvHeaders[number]]: string };

export interface CardInput extends CardsKeysType {
  deck: DeckId;
  customId?: string;
}

export interface ICard extends CardInput, Document {}

const CardSchema: Schema = new Schema(
  {
    deck: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
    srcLang: { type: String, required: true },
    trgLang: { type: String, required: true },
    srcText: { type: String, required: true },
    trgText: { type: String, required: true },
    customId: { type: String },
  },
  { timestamps: true }
);

export const CardModel = model<ICard>("Card", CardSchema);
