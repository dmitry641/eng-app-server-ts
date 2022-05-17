import axios, { AxiosRequestConfig } from "axios";
import { Card, globalCardsStore } from "../flashcards/cards";
import { CardInputOmit, CardsKeysType } from "../flashcards/models/cards.model";
import { DynamicSyncData, DynamicSyncType } from "../users/user.util";
import { globalDecksStore } from "./deck";
import { UserDeck } from "./userDeck";

export const SYNC_TIMEOUT_LIMIT = 120000;
export const SYNC_ATTEMPTS_COUNT_LIMIT = 3;

export class SyncClient {
  private fetcher: IFetcher;
  constructor(type: DynamicSyncType, data: DynamicSyncData) {
    this.fetcher = FetcherFactory.produce(type, data);
  }
  async syncHandler(dynUserDeck: UserDeck): Promise<boolean> {
    try {
      // хотелось бы instance of UserDynamicDeck, но увы...
      if (!dynUserDeck.dynamic) throw new Error("Dynamic userDeck is required");

      const deck = globalDecksStore.getDeckById(dynUserDeck.deckId);
      if (!deck) throw new Error("Deck doesn't exist");

      const rawCards = await this.fetcher.getRawCards();

      const existedCards = globalCardsStore.getCardsByDeckId(deck.id);
      const filteredRawCards = filterByCustomId(rawCards, existedCards);

      // повторный фильтр среди выученых по customId
      // для избежания добавления уже однажды выученых(после случайного удаления колоды)
      // FIX ME ???

      await globalCardsStore.createCards(filteredRawCards, deck);
      await dynUserDeck.setCardsCount(
        dynUserDeck.cardsCount + filteredRawCards.length
      );

      return true;
    } catch (error) {
      return false;
    }
  }
}

export function filterByCustomId(
  rawCards: CardInputOmit[],
  existedCards: Card[]
): CardInputOmit[] {
  const customIds: string[] = [];
  existedCards.forEach((c) => c.customId && customIds.push(c.customId));
  const filtered: CardInputOmit[] = [];
  rawCards.forEach(
    (c) => c.customId && !customIds.includes(c.customId) && filtered.push(c)
  );
  return filtered;
}

class FetcherFactory {
  static produce(type: DynamicSyncType, data: DynamicSyncData): IFetcher {
    switch (type) {
      case DynamicSyncType.reverso:
        return new ReversoFetcher(data);
      case DynamicSyncType.google:
        return new GoogleFetcher(data);
      default:
        throw new Error("not implemented");
    }
  }
}

interface IFetcher {
  readonly data: DynamicSyncData;
  getRawCards(): Promise<CardInputOmit[]>;
}

export class ReversoFetcher implements IFetcher {
  readonly data: DynamicSyncData;
  constructor(syncData: DynamicSyncData) {
    this.data = syncData;
  }
  async getRawCards(): Promise<CardInputOmit[]> {
    const accName = this.data.accountName;
    if (!accName) throw new Error("Account name is undefined");
    const options: AxiosRequestConfig = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
      },
      withCredentials: true,
    };
    const url = `https://context.reverso.net/bst-web-user/user/favourites/shared?userName=${accName}&start=0&length=1000&order=10`;
    const response = await axios.get<IReversoResponse>(url, options);
    const results = response?.data?.results;
    if (!results) throw new Error("Reverso fetch data error");
    if (!Array.isArray(results))
      throw new Error("Reverso results must be an array");
    const parsedWords = this.parseData(results);
    return parsedWords;
  }
  private parseData(array: IReversoResult[]): CardInputOmit[] {
    let newArray = [];

    for (let elem of array) {
      let obj = {
        srcLang: elem.srcLang,
        trgLang: elem.trgLang,
        srcText: elem.srcText,
        trgText: elem.trgText,
        customId: String(elem.id),
      };
      newArray.push(obj);
    }

    return newArray;
  }
}
class GoogleFetcher implements IFetcher {
  readonly data: DynamicSyncData;
  constructor(syncData: DynamicSyncData) {
    this.data = syncData;
  }
  async getRawCards(): Promise<CardInputOmit[]> {
    throw new Error("Method not implemented.");
  }
}

export interface IReversoResponse {
  numTotalResults: number;
  numFilteredResults: number;
  results: IReversoResult[];
}
export type IReversoResult = {
  id: number;
} & CardsKeysType;
