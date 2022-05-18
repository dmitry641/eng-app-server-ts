import { DeckDTO, DeckId } from "../decks/deck";
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
  private cardToDTO(card: Card) {
    return new CardDTO(card);
  }
  private getCard(cardId: CardId): Card {
    const card = this.cards.find((c) => c.id === cardId);
    if (!card) throw new Error("Card doesn't exist");
    return card;
  }
  getCardByCardId(cardId: CardId): CardDTO {
    const card = this.getCard(cardId);
    return this.cardToDTO(card);
  }
  getCardsByDeckId(deckId: DeckId): CardDTO[] {
    const filtered = this.cards.filter((c) => c.deckId === deckId);
    return filtered.map(this.cardToDTO);
  }
  async createCards(
    rawCards: CardInputOmit[],
    deck: DeckDTO
  ): Promise<CardDTO[]> {
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
    return newCards.map(this.cardToDTO);
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
export class CardDTO {
  readonly id: CardId;
  readonly deckId: DeckId;
  readonly customId?: string;
  readonly srcLang: string;
  readonly trgLang: string;
  readonly srcText: string;
  readonly trgText: string;
  constructor(card: Card) {
    this.id = card.id;
    this.deckId = card.deckId;
    this.customId = card.customId;
    this.srcLang = card.srcLang;
    this.trgLang = card.trgLang;
    this.srcText = card.srcText;
    this.trgText = card.trgText;
  }
}

export const globalCardsStore = new CardsStore();
