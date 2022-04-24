import { getCsvData } from "../../utils";
import { ObjId, UploadedFile } from "../../utils/types";
import {
  cardsCsvHeaders,
  CardsKeysType,
} from "../flashcards/models/cards.model";
import { User } from "../users/user";
import { DecksService } from "./decks.service";
import { IDeck } from "./models/decks.model";

class DecksStore {
  private initialized: boolean = false;
  private decks: Deck[] = [];
  init() {
    // ???

    if (this.initialized) throw new Error("DecksStore is already initialized");
    // ...
    this.initialized = true;
  }
  async createDeck(file: UploadedFile, user: User): Deck {
    const filename = file.originalname.replace(".csv", "");
    const cards = await getCsvData<CardsKeysType>(
      file.buffer,
      cardsCsvHeaders,
      ","
    );

    const dbDeck: IDeck = await DecksService.createDeck({
      createdBy: user.id,
      name: filename,
      totalCardsCount: 10000000,
    });
    const deck: Deck = new Deck(dbDeck);

    /*
    это выносим в ГлобалДек.креатеДек()
    // 
    // cards count = 100 (без добавления в базу, просто подсчёт)
    // deck: Deck = GlobalCreateDeck(filename, User, totalCount???)
    // cardsToDataBase(deck.id, cards) // общеие Кардс, не ЮзерКардс
    */
    // push to decks
  }
}
export const globalDecksStore = new DecksStore();

export type DeckId = ObjId;
export class Deck {
  id: DeckId;
  private _deck: IDeck;
  constructor(deck: IDeck) {
    this.id = deck._id;
    this._deck = deck;
  }
}
