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
      ","
    );

    const deck: Deck = await this.newDeck({
      createdBy: user.id,
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
  private _name: string;
  private _canBePublic: boolean;
  private _createdBy: UserId;
  private _public: boolean;
  private _totalCardsCount: number;
  constructor(deck: IDeck) {
    this.id = String(deck._id);
    this._deck = deck;
    this._name = deck.name;
    this._canBePublic = deck.canBePublic;
    this._createdBy = String(deck.createdBy);
    this._public = deck.public;
    this._totalCardsCount = deck.totalCardsCount;
  }
  get name() {
    return this._name;
  }
  get canBePublic() {
    return this._canBePublic;
  }
  get createdBy() {
    return this._createdBy;
  }
  get public() {
    return this._public;
  }
  get totalCardsCount() {
    return this._totalCardsCount;
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
  constructor(deck: Deck) {
    this.id = deck.id;
    this.name = deck.name;
    this.canBePublic = deck.canBePublic;
    this.createdBy = deck.createdBy;
    this.public = deck.public;
    this.totalCardsCount = deck.totalCardsCount;
  }
}

export const globalDecksStore = new DecksStore();
