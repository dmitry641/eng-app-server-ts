import { ObjId } from "../../utils/types";
import { Deck } from "../decks/deck";
import { CardsService } from "./flashcards.service";
import { CardInputOmit, ICard } from "./models/cards.model";

class CardsStore {
  private cards = new Map<Deck, Card[]>(); // спорный момент, массив хуже чем CardsClient/Helper/Manager
  async getCards(deck: Deck): Promise<Card[]> {
    let cards: Card[] | undefined;
    cards = this.cards.get(deck);
    if (cards) return cards;
    cards = await this.initCards(deck);
    this.cards.set(deck, cards);
    return cards;
  }
  async createCards(rawCards: CardInputOmit[], deck: Deck): Promise<Card[]> {
    const newCards: Card[] = [];
    for (const rawCard of rawCards) {
      const reg3 = /((,.?)\s*$)|("|“|”|«|»|;)/g;
      rawCard.srcText = rawCard.srcText.replace(reg3, "");
      rawCard.trgText = rawCard.trgText.replace(reg3, "");

      const dbCard = await CardsService.createCard({
        deck: deck.id,
        ...rawCard,
      });
      const newCard = new Card(dbCard);
      newCards.push(newCard);
    }
    const cards: Card[] = await this.getCards(deck);
    cards.push(...newCards); // спорный момент
    return cards;
  }
  private async initCards(deck: Deck): Promise<Card[]> {
    const dbCards = await CardsService.findCards({ deck: deck.id });
    const cards: Card[] = [];
    for (const dbCard of dbCards) {
      const card: Card = new Card(dbCard);
      cards.push(card);
    }
    return cards;
  }
}
export const globalCardsStore = new CardsStore();

export type CardId = ObjId;
export class Card {
  readonly id: CardId;
  private _customId?: string;
  private _card: ICard;
  constructor(card: ICard) {
    this.id = card._id;
    this._card = card;
    this._customId = card.customId;
  }
  get customId() {
    return this._customId;
  }
}
