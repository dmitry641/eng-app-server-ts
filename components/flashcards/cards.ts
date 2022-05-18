import { Deck, DeckId } from "../decks/deck";
import { CardsService } from "./flashcards.service";
import { CardInputOmit, ICard } from "./models/cards.model";

class CardsStore {
  private initialized: boolean = false;
  private cards: Card[] = [];
  async init() {
    if (this.initialized) throw new Error("CardsStore is already initialized");
    const dbCards = await CardsService.findCards({});
    for (const dbCard of dbCards) {
      const card: Card = new Card(dbCard);
      this.cards.push(card);
    }
    this.initialized = true;
  }
  getCardByCardId(cardId: CardId): Card {
    const card = this.cards.find((c) => c.id === cardId);
    if (!card) throw new Error("Card doesn't exist");
    return card;
  }
  getCardsByDeckId(deckId: DeckId): Card[] {
    return this.cards.filter((c) => c.deckId === deckId);
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
    this.cards.push(...newCards); // спорный момент
    return newCards;
  }
}

export type CardId = string;
export class Card {
  readonly id: CardId;
  private readonly _card: ICard;
  readonly deckId: DeckId;
  readonly customId?: string;
  readonly srcLang: string;
  readonly trgLang: string;
  readonly srcText: string;
  readonly trgText: string;
  constructor(card: ICard) {
    this.id = card._id;
    this._card = card;
    this.deckId = card.deck;
    this.customId = card.customId;
    this.srcLang = card.srcLang;
    this.trgLang = card.trgLang;
    this.srcText = card.srcText;
    this.trgText = card.trgText;
  }
}

export const globalCardsStore = new CardsStore();
