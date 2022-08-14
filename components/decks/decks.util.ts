import { UserDTO } from "../users/users.util";
import { IDeck } from "./models/decks.model";
import { IDecksSettings } from "./models/decksSettings.model";
import { IUserDeck } from "./models/userDecks.model";

export enum DynamicSyncType {
  reverso = "reverso",
  yandex = "yandex",
}

export enum UserDeckPositionEnum {
  up = "up",
  down = "down",
}

export type UploadedFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

export type DType = { deckId: string };
export type UDType = { userDeckId: string };
export type UDPosType = UDType & { position: UserDeckPositionEnum };
export type SyncDataType = { type: DynamicSyncType; link: string };
export type AutoSyncType = { value: boolean };

export class DeckDTO {
  readonly id: string;
  readonly name: string;
  readonly createdBy: UserDTO;
  readonly public: boolean;
  readonly totalCardsCount: number;
  constructor(deck: IDeck, user: UserDTO) {
    this.id = String(deck._id);
    this.name = deck.name;
    this.public = deck.public;
    this.totalCardsCount = deck.totalCardsCount;
    this.createdBy = user;
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

export const ascSortByOrderFn = <T extends { order: number }>(a: T, b: T) =>
  a.order - b.order;
