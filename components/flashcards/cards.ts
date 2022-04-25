import { ObjId } from "../../utils/types";
import { ICard } from "./models/cards.model";

export type CardId = ObjId;
export class Card {
  id: CardId;
  private _card: ICard;
  constructor(card: ICard) {
    this.id = card._id;
    this._card = card;
  }
}
