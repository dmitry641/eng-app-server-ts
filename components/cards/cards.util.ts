import { UserDeckDTO } from "../decks/decks.util";
import { ICard } from "./models/cards.model";
import { ICardsSettings } from "./models/cardsSettings.model";
import { IUserCard } from "./models/userCards.model";

export const cardsCsvHeaders = [
  "frontPrimary",
  "frontSecondary",
  "backPrimary",
  "backSecondary",
] as const;
export type CardsKeysType = { [K in typeof cardsCsvHeaders[number]]: string };

export const CARDS_COUNT = 15;

const hour = 1000 * 60 * 60;
const day = hour * 24;
const hardArray = [hour];
const mediumArray = [hour * 5, hour * 10];
const easyArray = [day, day * 3, day * 7, day * 20, day * 50, day * 300];

export const intervalArray = {
  hardArray,
  mediumArray,
  easyArray,
};

export type UCType = { userCardId: string };
export type UCStatusType = UCType & { status: HistoryStatusEnum };

export enum HistoryStatusEnum {
  easy = "easy",
  medium = "medium",
  hard = "hard",
}

export type HistoryType = { status: HistoryStatusEnum; date: number };

export enum UpdateTypeEnum {
  dynamicHighPriority = "dynamicHighPriority",
  showLearned = "showLearned",
  shuffleDecks = "shuffleDecks",
  frontSideFirst = "frontSideFirst",
  randomSideFirst = "randomSideFirst",
}

export type UpdateType = {
  type: UpdateTypeEnum;
  value: boolean;
};

export type LrnDelType = {
  userCard: UserCardDTO;
  userDeck?: UserDeckDTO;
};

export class CardDTO {
  readonly id: string;
  readonly deckId: string;
  readonly customId?: string;
  readonly frontPrimary: string;
  readonly frontSecondary: string;
  readonly backPrimary: string;
  readonly backSecondary: string;
  constructor(card: ICard) {
    this.id = String(card._id);
    this.deckId = String(card.deck);
    this.customId = card.customId;
    this.frontPrimary = card.frontPrimary;
    this.frontSecondary = card.frontSecondary;
    this.backPrimary = card.backPrimary;
    this.backSecondary = card.backSecondary;
  }
}

export class UserCardDTO {
  readonly id: string;
  readonly card: CardDTO;
  readonly userDeckId: string;
  readonly deleted: boolean;
  readonly history: HistoryType[];
  readonly showAfter: number;
  readonly favorite: boolean;
  constructor(userCard: IUserCard, card: CardDTO) {
    this.id = String(userCard._id);
    this.card = card;
    this.userDeckId = String(userCard.userDeck);
    this.deleted = userCard.deleted;
    this.history = userCard.history;
    this.showAfter = userCard.showAfter;
    this.favorite = userCard.favorite;
  }
}

export class CardsSettingsDTO {
  readonly dynamicHighPriority: boolean;
  readonly showLearned: boolean;
  readonly shuffleDecks: boolean;
  readonly frontSideFirst: boolean;
  readonly randomSideFirst: boolean;
  constructor(settings: ICardsSettings) {
    this.dynamicHighPriority = settings.dynamicHighPriority;
    this.showLearned = settings.showLearned;
    this.shuffleDecks = settings.shuffleDecks;
    this.frontSideFirst = settings.frontSideFirst;
    this.randomSideFirst = settings.randomSideFirst;
  }
}

export function calcShowAfter(
  status: HistoryStatusEnum,
  history: HistoryType[]
): number {
  let newShowAfter = Date.now();
  const intervalsArray = getIntervalArray(status);
  if (intervalsArray.length == 0) throw new Error("Array cannot be empty"); // FIXME ???

  let streak = getStreak(status, history);
  if (streak >= intervalsArray.length) {
    streak = intervalsArray.length - 1;
  }
  newShowAfter += intervalsArray[streak] || 0;
  return newShowAfter;
}
export function getIntervalArray(status: HistoryStatusEnum) {
  switch (status) {
    case HistoryStatusEnum.easy:
      return intervalArray.easyArray;
    case HistoryStatusEnum.medium:
      return intervalArray.mediumArray;
    case HistoryStatusEnum.hard:
      return intervalArray.hardArray;
    default:
      throw new Error("Invalid status");
  }
}
export function getStreak(status: HistoryStatusEnum, history: HistoryType[]) {
  let result = 0;
  let tempHistory = Array.from(history);
  tempHistory.reverse();
  for (let el of tempHistory) {
    if (el.status != status) break;
    result += 1;
  }
  return result;
}
export function slice<T>(array: T[]): T[] {
  return array.slice(0, CARDS_COUNT);
}

export function filterByCardId(
  cards: ICard[],
  userCards: IUserCard[]
): ICard[] {
  const existedCardIds = userCards.map((uc) => String(uc.card));
  const filtered = cards.filter((c) => !existedCardIds.includes(String(c._id)));
  return filtered;
}
