import { UserDTO } from "../users/users.util";
import { IDeck } from "./models/decks.model";
import { IDecksSettings } from "./models/decksSettings.model";
import { IUserDeck } from "./models/userDecks.model";

export const SYNC_TIMEOUT_LIMIT = 120000;
export const SYNC_ATTEMPTS_COUNT_LIMIT = 3;

export enum DynamicSyncType {
  reverso = "reverso",
  yandex = "yandex",
}

export enum UDPositionEnum {
  up = "up",
  down = "down",
}

export type UploadedFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

export enum UserJobTypesEnum {
  deckSync = "deckSync",
  notification = "notification",
}

export type DType = { deckId: string };
export type UDType = { userDeckId: string };
export type UDPosType = UDType & { position: UDPositionEnum };
export type SyncDataType = { type: DynamicSyncType; link: string };
export type AutoSyncType = { value: boolean };

export class DeckDTO {
  readonly id: string;
  readonly name: string;
  readonly createdBy: Omit<UserDTO, "email">;
  readonly public: boolean;
  readonly totalCardsCount: number;
  constructor(deck: IDeck, user: UserDTO) {
    this.id = String(deck._id);
    this.name = deck.name;
    this.public = deck.public;
    this.totalCardsCount = deck.totalCardsCount;
    const { email, ...userWOemail } = user;
    this.createdBy = userWOemail;
  }
}

export class UserDeckDTO {
  readonly id: string;
  readonly deck: DeckDTO;
  readonly dynamic: boolean;
  readonly enabled: boolean;
  readonly deleted: boolean;
  readonly order: number;
  readonly cardsCount: number;
  readonly cardsLearned: number;
  readonly canPublish: boolean;
  readonly published: boolean;
  constructor(userDeck: IUserDeck, deck: DeckDTO) {
    this.id = String(userDeck._id);
    this.dynamic = userDeck.dynamic;
    this.enabled = userDeck.enabled;
    this.deleted = userDeck.deleted;
    this.order = userDeck.order;
    this.cardsCount = userDeck.cardsCount;
    this.cardsLearned = userDeck.cardsLearned;
    this.deck = deck;
    this.published = deck.public;
    this.canPublish =
      String(userDeck.user) === String(deck.createdBy) && !userDeck.dynamic;
  }
}

export class DecksSettingsDTO {
  readonly maxOrder: number;
  readonly dynamicSyncType?: IDecksSettings["dynamicSyncType"];
  readonly dynamicSyncLink?: IDecksSettings["dynamicSyncLink"];
  readonly dynamicAutoSync: boolean;
  readonly dynamicSyncMessage?: string;
  readonly dynamicSyncAttempts: number[];
  readonly dynamicCreated: boolean;
  constructor(settings: IDecksSettings) {
    this.maxOrder = settings.maxOrder;
    this.dynamicSyncType = settings.dynamicSyncType;
    this.dynamicSyncLink = settings.dynamicSyncLink;
    this.dynamicAutoSync = settings.dynamicAutoSync;
    this.dynamicSyncMessage = settings.dynamicSyncMessage;
    this.dynamicCreated = settings.dynamicCreated;
    this.dynamicSyncAttempts = settings.dynamicSyncAttempts;
  }
}
