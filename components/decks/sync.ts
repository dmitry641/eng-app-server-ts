import axios, { AxiosRequestConfig } from "axios";
import { CardInputOmit } from "../flashcards/models/cards.model";
import { UserDecksSettings } from "../users/user";
import { DynamicSyncData, DynamicSyncType } from "../users/user.util";
import { UserDecksClient } from "./userDeck";

export const SYNC_TIMEOUT_LIMIT = 120000;
export const SYNC_ATTEMPTS_COUNT_LIMIT = 3;

export class SyncClient {
  private fetcher: IFetcher;
  constructor(private userDecksClient: UserDecksClient) {
    this.fetcher = FetcherFactory.produce(userDecksClient.settings);
  }
  async syncHandler(): Promise<boolean> {
    // в Скедул инит, мы поместим юзера
    // и потом внутри, два варианта:
    // либо через этот синк клиент (предпочтительнее)
    // либо через юзер дек клиент

    // rawCards = ...
    // ГлобалКардс.что-то(rawCards, deck.id)
    // dynamicDeck.setCardsCount(...)

    const dynDeck = this.userDecksClient.getDynamicDeck();
    if (!dynDeck) throw new Error("Dynamic deck doesn't exist");

    const rawCards = this.fetcher.getRawCards();
    // получаем уже существующие карточки
    // compareArraysById() - удаляем из rawCards те карточки, которые уже существуют

    return true;
  }
}

class FetcherFactory {
  static produce(settings: UserDecksSettings): IFetcher {
    // очень спорный момент с throw new Error()
    const type = settings.getDynamicSyncType();
    if (!type) throw new Error("DynamicSyncType is undefined");
    const data = settings.getDynamicSyncData();
    if (!data) throw new Error("dynamicSyncData is undefined");
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

class ReversoFetcher implements IFetcher {
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
    const results = response.data.results;
    if (!results) throw new Error("Reverso fetch data error");
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

interface IReversoResponse {
  numTotalResults: number;
  numFilteredResults: number;
  results: IReversoResult[];
}
interface IReversoResult {
  id: number;
  srcText: string;
  trgText: string;
  srcLang: string;
  trgLang: string;
}
