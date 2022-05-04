import { shuffle } from "../../utils";
import { ObjId } from "../../utils/types";
import { globalDecksStore } from "../decks/deck";
import {
  globalUserDecksStore,
  sortByOrderFn,
  UserDeck,
} from "../decks/userDeck";
import { User, UserCardsSettings } from "../users/user";
import { Card, CardId, globalCardsStore } from "./cards";
import { UserCardsService } from "./flashcards.service";
import { HistoryStatusEnum, IUserCard } from "./models/userCards.model";

const CARDS_COUNT = 15;

class UserCardsClient {
  private settings: UserCardsSettings;
  constructor(private userCards: UserCard[], private user: User) {
    this.settings = user.settings.userCardsSettings;
  }
  deleteUserCard(userCardId: UserCardId) {
    // Нарушение все возможных паттернов......
    // const userCard = getUserCard(userCardId)
    // if userCard.deleted throw already deleted
    // await userCard.delete()
    // userDecksClient = globalUserDecksStore.get(this.user)
    // const userDeck = userDecksClient.getUserDeckById(userCard.userDeckId)
    // await userDeck.setCardsCount(userDeck.cardsCount - 1)
    // на фронте при 200, обновлять UserDeck.cardsCount - 1
    //
  }
  favoriteUserCard(userCardId: UserCardId) {}
  learnUserCard(userCardId: UserCardId, status: HistoryStatusEnum) {}
  getFavorites() {}
  async getUserCards(): Promise<UserCard[]> {
    let result: UserCard[] = [];

    result = this.getEmptyUserCards();
    if (result.length !== 0) {
      return slice(result); // pool/empty history
    }

    if (this.settings.dynamicHighPriority) {
      result = await this.getUserCardsFromDynamicUserDeck();
      if (result.length !== 0) return result; // dynamic deck
    }

    result = this.getLearnedUserCards();
    if (result.length !== 0) {
      return slice(result); // repeated/learned
    }

    result = await this.getUserCardsFromSortedUserDecks(); // order/shuffle deck
    return result;
  }
  private filterCards(cards: Card[]): Card[] {
    const existedCardIds = this.userCards.map((c) => c.cardId);
    const filtered = cards.filter((c) => !existedCardIds.includes(c.id));
    return filtered; // FIX ME, протестировать
  }
  private async getUserCardsFromSortedUserDecks(): Promise<UserCard[]> {
    let newUserCards: UserCard[] = [];
    const userDecksClient = await globalUserDecksStore.getUserDecksClient(
      this.user
    );
    let userDecks: UserDeck[] = userDecksClient
      .getUserDecks()
      .sort(sortByOrderFn);

    const shuffleDecks = this.settings.shuffleDecks;
    if (shuffleDecks) userDecks = shuffle(userDecks);

    for (const userDeck of userDecks) {
      newUserCards = await this.getUserCardsFromUserDeck(userDeck);
      if (newUserCards.length != 0) break;
    }
    return newUserCards;
  }
  private async getUserCardsFromDynamicUserDeck(): Promise<UserCard[]> {
    let newUserCards: UserCard[] = [];
    const userDeckClient = await globalUserDecksStore.getUserDecksClient(
      this.user
    );
    const dynUserDeck = userDeckClient.getDynamicUserDeck();
    if (dynUserDeck) {
      newUserCards = await this.getUserCardsFromUserDeck(dynUserDeck);
    }
    return newUserCards;
  }
  private getEmptyUserCards(): UserCard[] {
    return this.userCards.filter((c) => c.history.length === 0);
  }
  private getLearnedUserCards(): UserCard[] {
    const dateNow = Date.now();
    const filtered = this.userCards.filter((c) => dateNow > c.showAfter);
    const sorted = filtered.sort((a, b) => a.showAfter - b.showAfter);
    return sorted;
  }
  private async getUserCardsFromUserDeck(
    userdeck: UserDeck
  ): Promise<UserCard[]> {
    // filtered + shuffled + sliced
    const processedUserCards: UserCard[] = [];
    const deck = globalDecksStore.getDeckById(userdeck.deckId);
    const cards = await globalCardsStore.getCards(deck);
    const filteredCards: Card[] = this.filterCards(cards);
    const shuffledCards: Card[] = shuffle(filteredCards);
    const slicedCards: Card[] = slice(shuffledCards);
    for (const card of slicedCards) {
      const dbUserCard = await UserCardsService.createUserCard({
        card: card.id,
        user: this.user.id,
        userDeck: userdeck.id,
      });
      const userCard = new UserCard(dbUserCard);
      processedUserCards.push(userCard);
    }
    this.userCards.push(...processedUserCards); // спорный момент
    return processedUserCards;
  }
}

function slice<T>(array: T[]): T[] {
  return array.slice(0, CARDS_COUNT);
}

export type UserCardId = ObjId;
export class UserCard {
  readonly id: UserCardId;
  private _usercard: IUserCard;
  private _cardId: CardId;
  private _deleted: boolean;
  private _history: IUserCard["history"];
  private _showAfter: number;
  private _favorite: boolean;
  constructor(usercard: IUserCard) {
    this.id = usercard._id;
    this._usercard = usercard;
    this._cardId = usercard.card;
    this._deleted = usercard.deleted;
    this._history = usercard.history;
    this._showAfter = usercard.showAfter;
    this._favorite = usercard.favorite;
  }
  get cardId() {
    return this._cardId;
  }
  get deleted() {
    return this._deleted;
  }
  get history() {
    return this._history;
  }
  get showAfter() {
    return this._showAfter;
  }
  get favorite() {
    return this._favorite;
  }
  async makeLearned(status: HistoryStatusEnum) {
    switch (status) {
      case HistoryStatusEnum.easy:
        return this.easy();
      case HistoryStatusEnum.medium:
        return this.medium();
      case HistoryStatusEnum.hard:
        return this.hard();
      default:
        throw new Error("Invalid status");
    }
  }
  private async easy() {}
  private async medium() {}
  private async hard() {}
}
