import { UserDTO } from "../users/users.util";
import { IDeck } from "./models/decks.model";
import { IUserDeck } from "./models/userDecks.model";

export enum UDPositionEnum {
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
export type UDPosType = UDType & { position: UDPositionEnum };

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
  readonly enabled: boolean;
  readonly deleted: boolean;
  readonly order: number;
  readonly cardsCount: number;
  readonly cardsLearned: number;
  readonly canPublish: boolean;
  readonly published: boolean;
  constructor(userDeck: IUserDeck, deck: DeckDTO) {
    this.id = String(userDeck._id);
    this.enabled = userDeck.enabled;
    this.deleted = userDeck.deleted;
    this.order = userDeck.order;
    this.cardsCount = userDeck.cardsCount;
    this.cardsLearned = userDeck.cardsLearned;
    this.deck = deck;
    this.published = deck.public;
    this.canPublish = String(userDeck.user) === deck.createdBy.id;
  }
}
