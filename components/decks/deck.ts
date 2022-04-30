import { getCsvData } from "../../utils";
import { ObjId, UploadedFile } from "../../utils/types";
import {
  cardsCsvHeaders,
  CardsKeysType,
} from "../flashcards/models/cards.model";
import { User, UserId } from "../users/user";
import { DecksService } from "./decks.service";
import { DeckInput, IDeck } from "./models/decks.model";
import { UserDeck } from "./userDeck";

class DecksStore {
  private initialized: boolean = false;
  private decks: Deck[] = [];
  init() {
    // ???

    if (this.initialized) throw new Error("DecksStore is already initialized");
    // ...
    this.initialized = true;
  }
  async createDeck(file: UploadedFile, user: User): Promise<Deck> {
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
    // FIX ME
    // ГлобалКардс.что-то(rawCards, deck.id)
    // или deck.createCards(rawCards)
    // или вообще не тут это делать, а в отдельном классе + не делать разделение на createDeck и createDynamicDeck
    // спорный момент

    return deck;
  }
  async createDynamicDeck(user: User): Promise<Deck> {
    const deck = await this.newDeck({
      createdBy: user.id,
      name: "Dynamic deck",
      totalCardsCount: 0, // спорный момент
      canBePublic: false,
    });
    return deck;
  }
  getDeckById(deckId: DeckId): Deck | undefined {
    return this.decks.find((d) => d.id === deckId);
  }

  async toggleDeckPublic(userDeck: UserDeck): Promise<Deck> {
    const deck = this.getDeckById(userDeck.deckId);
    if (!deck) throw new Error("Deck not found");
    if (!deck.canBePublic) throw new Error("Deck cannot be public");

    if (deck.public) await deck.setPublic(false);
    else await deck.setPublic(true);

    return deck;
  }

  private async newDeck(obj: DeckInput): Promise<Deck> {
    const dbDeck: IDeck = await DecksService.createDeck(obj);
    const deck: Deck = new Deck(dbDeck);
    this.decks.push(deck); // спорный момент
    return deck;
  }
}
export const globalDecksStore = new DecksStore();

export type DeckId = ObjId;
export class Deck {
  readonly id: DeckId;
  private _name: string;
  private _canBePublic: boolean;
  private _createdBy: UserId;
  private _public: boolean;
  private _totalCardsCount: number;
  private _deck: IDeck;
  constructor(deck: IDeck) {
    this.id = deck._id;
    this._deck = deck;
    this._name = deck.name;
    this._canBePublic = deck.canBePublic;
    this._createdBy = deck.createdBy;
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
