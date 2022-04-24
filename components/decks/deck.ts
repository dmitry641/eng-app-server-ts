import { ObjId } from "../../utils/types";
import { User } from "../users/user";

class DecksStore {
  private decks: Deck[] = [];
  init() {} // ???
  async createDeck(file: Buffer, user: User): Deck {
    /*
    это выносим в ГлобалДек.креатеДек()
    // const filename = file.originalname.replace(".csv", "");
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
  // id: DeckId;
  // private _deck: IDeck;
}
