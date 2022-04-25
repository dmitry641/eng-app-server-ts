import { getCsvData } from "../../utils";
import { ObjId, UploadedFile } from "../../utils/types";
import {
  cardsCsvHeaders,
  CardsKeysType,
} from "../flashcards/models/cards.model";
import { User } from "../users/user";
import { DecksService } from "./decks.service";
import { DeckInput, IDeck } from "./models/decks.model";

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
    const rawCardsData: CardsKeysType[] = await getCsvData<CardsKeysType>(
      file.buffer,
      cardsCsvHeaders,
      ","
    );

    const deck: Deck = await this.newDeck({
      createdBy: user.id,
      name: filename,
      totalCardsCount: rawCardsData.length,
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
  id: DeckId;
  totalCardsCount: number;
  private _deck: IDeck;
  constructor(deck: IDeck) {
    this.id = deck._id;
    this._deck = deck;
    this.totalCardsCount = deck.totalCardsCount;
  }
}
