import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { UserDeckDTO } from "../decks/decks.util";
import { calcShowAfter } from "./cards.service";
import { ICard } from "./models/cards.model";
import { ICardsSettings } from "./models/cardsSettings.model";
import { IUserCard } from "./models/userCards.model";
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

export const cardsCsvHeaders = [
  "frontPrimary",
  "frontSecondary",
  "backPrimary",
  "backSecondary",
] as const;
export type CardsKeysType = { [K in (typeof cardsCsvHeaders)[number]]: string };

export const CARDS_COUNT = 15;

export const HOUR = () => 1000 * 60 * 60;

export type UCType = { userCardId: string };
export type UCStatusType = UCType & { status: boolean };

export enum UpdateTypeEnum {
  showLearned = "showLearned",
  shuffleDecks = "shuffleDecks",
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
  readonly frontPrimary: string;
  readonly frontSecondary: string;
  readonly backPrimary: string;
  readonly backSecondary: string;
  constructor(card: ICard) {
    this.id = String(card._id);
    this.deckId = String(card.deck);
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
  readonly streak: number;
  readonly showAfter: number;
  readonly stepBack: string;
  readonly stepForward: string;
  readonly favorite: boolean;
  constructor(userCard: IUserCard, card: CardDTO) {
    this.id = String(userCard._id);
    this.card = card;
    this.userDeckId = String(userCard.userDeck);
    this.deleted = userCard.deleted;
    this.streak = userCard.streak;
    this.showAfter = userCard.showAfter;
    this.favorite = userCard.favorite;
    const back = calcShowAfter(false, 0);
    const forward = calcShowAfter(true, userCard.streak + 1);
    this.stepBack = timeAgo.format(back);
    this.stepForward = timeAgo.format(forward);
  }
}

export class CardsSettingsDTO {
  readonly showLearned: boolean;
  readonly shuffleDecks: boolean;
  constructor(settings: ICardsSettings) {
    this.showLearned = settings.showLearned;
    this.shuffleDecks = settings.shuffleDecks;
  }
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
