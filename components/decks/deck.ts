import { getCsvData } from "../../utils";
import { UploadedFile } from "../../utils/types";
import { globalCardsStore } from "../flashcards/cards";
import {
  cardsCsvHeaders,
  CardsKeysType,
} from "../flashcards/models/cards.model";
import { User, UserId } from "../users/user";
import { DeckInput, IDeck } from "./models/decks.model";
import { DecksService } from "./services/decks.service";
import { UserDeckDTO } from "./userDeck";

class DecksStore {
  private initialized: boolean = false;
  private decks: Deck[] = [];
  async init() {
    if (this.initialized) throw new Error("DecksStore is already initialized");
    const dbDecks = await DecksService.findDecks({});
    for (const dbDeck of dbDecks) {
      const deck: Deck = new Deck(dbDeck);
      this.decks.push(deck);
    }
    this.initialized = true;
  }
  private deckToDTO(deck: Deck): DeckDTO {
    return new DeckDTO(deck);
  }
  async createDeck(file: UploadedFile, user: User): Promise<DeckDTO> {
    const filename = file.originalname.replace(".csv", "");
    const rawCards: CardsKeysType[] = await getCsvData<CardsKeysType>(
      file.buffer,
      cardsCsvHeaders,
      [true, false, true, false],
      ","
    );

    const deck: Deck = await this.newDeck({
      createdBy: user.id,
      author: user.name,
      name: filename,
      totalCardsCount: rawCards.length,
      canBePublic: true,
    });

    const dto = this.deckToDTO(deck);
    await globalCardsStore.createCards(rawCards, dto);

    return dto;
  }
  async createDynamicDeck(user: User): Promise<DeckDTO> {
    const deck = await this.newDeck({
      createdBy: user.id,
      author: user.name,
      name: "Dynamic deck",
      totalCardsCount: 0, // спорный момент
      canBePublic: false,
    });
    return this.deckToDTO(deck);
  }
  private getDeck(deckId: DeckId): Deck {
    const deck = this.decks.find((d) => d.id === deckId);
    if (!deck) throw new Error("Deck doesn't exist");
    return deck;
  }
  getDeckById(deckId: DeckId): DeckDTO {
    // if (!this.initialized) throw new Error("Not initialized")
    const deck = this.getDeck(deckId);
    return this.deckToDTO(deck);
  }
  getPublicDecks(): DeckDTO[] {
    const filtered = this.decks.filter((d) => d.public);
    return filtered.map((d) => this.deckToDTO(d));
  }
  async toggleDeckPublic(userDeck: UserDeckDTO): Promise<DeckDTO> {
    const deck = this.getDeck(userDeck.deckId);
    if (userDeck.ownedBy !== deck.createdBy)
      throw new Error("Only the owner can make changes");
    if (!deck.canBePublic) throw new Error("Deck cannot be public");

    if (deck.public) await deck.setPublic(false);
    else await deck.setPublic(true);

    return this.deckToDTO(deck);
  }
  private async newDeck(obj: DeckInput): Promise<Deck> {
    const dbDeck: IDeck = await DecksService.createDeck(obj);
    const deck: Deck = new Deck(dbDeck);
    this.decks.push(deck); // спорный момент
    return deck;
  }
}

export type DeckId = string;
export class Deck {
  readonly id: DeckId;
  private readonly _deck: IDeck;
  readonly name: string;
  readonly canBePublic: boolean;
  readonly author: string;
  readonly createdBy: UserId;
  readonly totalCardsCount: number;
  private _public: boolean;
  constructor(deck: IDeck) {
    this.id = String(deck._id);
    this._deck = deck;
    this.name = deck.name;
    this.canBePublic = deck.canBePublic;
    this.createdBy = String(deck.createdBy);
    this.totalCardsCount = deck.totalCardsCount;
    this.author = deck.author;
    this._public = deck.public;
  }
  get public() {
    return this._public;
  }
  async setPublic(value: boolean): Promise<Deck> {
    if (value && !this.canBePublic)
      throw new Error("This deck cannot be public");
    this._public = value;
    this._deck.public = value;
    await this._deck.save();
    return this;
  }
}
export class DeckDTO {
  readonly id: DeckId;
  readonly name: string;
  readonly canBePublic: boolean;
  readonly createdBy: UserId;
  readonly public: boolean;
  readonly totalCardsCount: number;
  readonly author: string;
  constructor(deck: Deck) {
    this.id = deck.id;
    this.name = deck.name;
    this.canBePublic = deck.canBePublic;
    this.createdBy = deck.createdBy;
    this.public = deck.public;
    this.totalCardsCount = deck.totalCardsCount;
    this.author = deck.author;
  }
}

export const globalDecksStore = new DecksStore();
