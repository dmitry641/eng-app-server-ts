import axios, { AxiosRequestConfig } from "axios";
import URLParse, { qs } from "url-parse";
import { CardDTO, globalCardsStore } from "../flashcards/cards";
import { CardInputOmit } from "../flashcards/models/cards.model";
import { DynamicSyncType } from "../users/users.util";
import { globalDecksStore } from "./deck";
import { UserDeck } from "./userDeck";

export const SYNC_TIMEOUT_LIMIT = 120000;
export const SYNC_ATTEMPTS_COUNT_LIMIT = 3;

export class SyncClient {
  private fetcher: IFetcher;
  constructor(type: DynamicSyncType, link: string) {
    this.fetcher = FetcherFactory.produce(type, link);
  }
  async syncHandler(dynUserDeck: UserDeck): Promise<[boolean, string?]> {
    // хотелось бы instance of UserDynamicDeck, но увы...
    if (!dynUserDeck.dynamic) throw new Error("Dynamic userDeck is required");

    const deck = globalDecksStore.getDeckById(dynUserDeck.deckId);

    try {
      const rawCards = await this.fetcher.getRawCards();

      const existedCards = globalCardsStore.getCardsByDeckId(deck.id);
      const filteredRawCards = filterByCustomId(rawCards, existedCards);

      await globalCardsStore.createCards(filteredRawCards, deck);
      await dynUserDeck.setCardsCount(
        dynUserDeck.cardsCount + filteredRawCards.length
      );

      return [true];
    } catch (error) {
      const err = error as Error;
      return [false, err?.message];
    }
  }
}

export function filterByCustomId(
  rawCards: CardInputOmit[],
  existedCards: CardDTO[]
): CardInputOmit[] {
  const customIds: string[] = [];
  existedCards.forEach((c) => c.customId && customIds.push(c.customId));
  const filtered: CardInputOmit[] = [];
  rawCards.forEach(
    (c) => c.customId && !customIds.includes(c.customId) && filtered.push(c)
  ); // спорный момент
  return filtered;
}

class FetcherFactory {
  static produce(type: DynamicSyncType, link: string): IFetcher {
    switch (type) {
      case DynamicSyncType.reverso:
        return new ReversoFetcher(link);
      case DynamicSyncType.yandex:
        return new YandexFetcher(link);
      default:
        throw new Error("not implemented");
    }
  }
}

interface IFetcher {
  readonly link: string;
  getRawCards(): Promise<CardInputOmit[]>;
}

export class ReversoFetcher implements IFetcher {
  constructor(readonly link: string) {}
  async getRawCards(): Promise<CardInputOmit[]> {
    const [_, accName] = this.link.split(
      "https://context.reverso.net/favourites/"
    );
    if (!accName) throw new Error("Link error");
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
    if (!Array.isArray(results)) {
      throw new Error("Reverso results must be an array");
    }
    const parsedWords = this.parseData(results);
    return parsedWords;
  }
  private parseData(array: IReversoResult[]): CardInputOmit[] {
    let newArray = [];

    for (let elem of array) {
      let obj = {
        frontPrimary: elem.srcText,
        frontSecondary: "",
        backPrimary: elem.trgText,
        backSecondary: "",
        customId: String(elem.id),
      };
      newArray.push(obj);
    }

    return newArray;
  }
}
export class YandexFetcher implements IFetcher {
  constructor(readonly link: string) {}
  async getRawCards(): Promise<CardInputOmit[]> {
    const query = qs.parse(URLParse(this.link).query);
    const colId = query?.collection_id;
    if (!colId) throw new Error("Link error");

    const firstReq = await axios.get(
      "https://translate.yandex.ru/subscribe?collection_id=5b84234c898789001f7fea81"
    );
    let cookieArr = firstReq?.headers?.["set-cookie"] || [];
    cookieArr = cookieArr.map((el) => {
      const split = el.split(" ")[0] || "1=1";
      return split;
    });
    if (cookieArr.length == 0) throw new Error("Sync error");

    const res = await axios.get<IYandexResponse>(
      `https://translate.yandex.ru/props/api/collections/${colId}?srv=tr-text`,
      { headers: { Cookie: cookieArr.join(" ") } }
    );
    const records = res?.data?.collection?.records;
    if (!records || !Array.isArray(records)) throw new Error("Fetch error");

    const results: Array<CardInputOmit> = this.parseData(records);
    return results;
  }
  private parseData(array: IYandexResult[]): CardInputOmit[] {
    let newArray = [];
    for (let elem of array) {
      let obj = {
        frontPrimary: elem.text,
        frontSecondary: "",
        backPrimary: elem.translation,
        backSecondary: "",
        customId: elem.id,
      };
      newArray.push(obj);
    }

    return newArray;
  }
}

export interface IReversoResponse {
  numTotalResults: number;
  numFilteredResults: number;
  results: IReversoResult[];
}
export type IReversoResult = {
  id: number;
  srcLang: string;
  srcText: string;
  trgLang: string;
  trgText: string;
};

export interface IYandexResponse {
  collection: {
    count: number;
    public: boolean;
    records: IYandexResult[];
  };
}
export type IYandexResult = {
  id: string;
  text: string;
  translation: string;
};
