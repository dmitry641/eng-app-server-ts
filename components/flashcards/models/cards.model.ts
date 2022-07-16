import { Document, model, Schema } from "mongoose";
import { DeckId } from "../../decks/deck";

export const cardsCsvHeaders = [
  "frontPrimary",
  "frontSecondary",
  "backPrimary",
  "backSecondary",
] as const;
export type CardsKeysType = { [K in typeof cardsCsvHeaders[number]]: string };

export interface CardInput extends CardsKeysType {
  deck: DeckId;
  customId?: string;
}
export type CardInputOmit = Omit<CardInput, "deck">;

export interface ICard extends CardInput, Document {}

const CardSchema: Schema = new Schema(
  {
    deck: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
    frontPrimary: { type: String, required: true },
    frontSecondary: { type: String },
    backPrimary: { type: String, required: true },
    backSecondary: { type: String },
    customId: { type: String },
  },
  { timestamps: true }
);

export const CardModel = model<ICard>("Card", CardSchema);
