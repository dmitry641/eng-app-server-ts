import { shuffle } from "../../utils";
import {
  ascSortByOrderFn,
  UserDeckDTO,
  UserDeckId,
  userDecksManager,
} from "../decks/userDeck";
import { User, UserCardsSettings, UserId } from "../users/user";
import { CardDTO, CardId, globalCardsStore } from "./cards";
import { UserCardsService } from "./flashcards.service";
import {
  HistoryStatusEnum,
  HistoryType,
  IUserCard,
} from "./models/userCards.model";

const CARDS_COUNT = 15;

class UserCardsManager {
  private userCardsClients = new Map<UserId, UserCardsClient>();
  async getUserCardsClient(user: User): Promise<UserCardsClient> {
    let userCardsClient;
    userCardsClient = this.userCardsClients.get(user.id);
    if (userCardsClient) return userCardsClient;

    const userCards = await this.getUserCards(user);
    userCardsClient = new UserCardsClient(userCards, user);

    this.userCardsClients.set(user.id, userCardsClient);
    return userCardsClient;
  }
  private async getUserCards(user: User): Promise<UserCard[]> {
    let userCards: UserCard[] = [];
    const dbUserCards = await UserCardsService.findUserCards({
      user: user.id,
      deleted: false,
    });

    for (let dbUserCard of dbUserCards) {
      const card = globalCardsStore.getCardByCardId(dbUserCard.card);
      const userCard = new UserCard(dbUserCard, card);
      userCards.push(userCard);
    }

    return userCards;
  }
}

class UserCardsClient {
  private settings: UserCardsSettings;
  constructor(private userCards: UserCard[], private user: User) {
    this.settings = user.settings.userCardsSettings;
  }
  private userCardToDTO(userCard: UserCard): UserCardDTO {
    return new UserCardDTO(userCard);
  }
  async deleteUserCard(userCardId: UserCardId) {
    const userCard = this.getUserCard(userCardId);
    if (userCard.deleted) throw new Error("UserCard is already deleted");
    const result = await userCard.delete();
    this.userCards = this.userCards.filter((c) => c.id !== userCardId);
    // очень спорный момент...
    // нарушение все возможных паттернов...
    const udclient = await userDecksManager.getUserDecksClient(this.user);
    const userDeck = udclient.getUserDeckById(userCard.userDeckId);
    await udclient.updateCardsCount(userDeck.id, userDeck.cardsCount - 1);
    return result;
  }
  async favoriteUserCard(userCardId: UserCardId): Promise<UserCardDTO> {
    const userCard = this.getUserCard(userCardId);
    if (userCard.favorite) await userCard.setFavorite(false);
    else await userCard.setFavorite(true);
    return this.userCardToDTO(userCard);
  }
  async learnUserCard(
    userCardId: UserCardId,
    status: HistoryStatusEnum
  ): Promise<UserCardDTO> {
    const userCard = this.getUserCard(userCardId);
    const historyLen = Number(userCard.history.length);
    await userCard.learn(status);
    if (historyLen == 0) {
      const udclient = await userDecksManager.getUserDecksClient(this.user);
      const userDeck = udclient.getUserDeckById(userCard.userDeckId);
      await udclient.updateCardsLearned(userDeck.id, userDeck.cardsLearned + 1);
    }
    return this.userCardToDTO(userCard);
  }
  getFavorites(): UserCardDTO[] {
    const favorites = this.userCards.filter((uc) => uc.favorite);
    return favorites.map(this.userCardToDTO);
  }
  private getUserCard(userCardId: UserCardId): UserCard {
    const userCard = this.userCards.find((c) => c.id === userCardId);
    if (!userCard) throw new Error("UserCard doesn't exist");
    return userCard;
  }
  async getUserCards(): Promise<UserCardDTO[]> {
    let result: UserCard[] = [];

    result = this.getEmptyUserCards();
    if (result.length !== 0) {
      return slice(result).map(this.userCardToDTO); // pool/empty history
    }

    if (this.settings.dynamicHighPriority) {
      result = await this.getUserCardsFromDynamicUserDeck();
      if (result.length !== 0) return result.map(this.userCardToDTO); // dynamic deck
    }

    result = this.getLearnedUserCards();
    if (result.length !== 0) {
      return slice(result).map(this.userCardToDTO); // repeated/learned
    }

    result = await this.getUserCardsFromSortedUserDecks(); // order/shuffle deck
    return result.map(this.userCardToDTO);
  }
  private filterCards(cards: CardDTO[]): CardDTO[] {
    const existedCardIds = this.userCards.map((c) => c.cardId);
    const filtered = cards.filter((c) => !existedCardIds.includes(c.id));
    return filtered; // FIX ME, протестировать(сделать не private?)
  }
  private async getUserCardsFromSortedUserDecks(): Promise<UserCard[]> {
    let newUserCards: UserCard[] = [];
    const udclient = await userDecksManager.getUserDecksClient(this.user);
    let userDecks = udclient.getUserDecks().sort(ascSortByOrderFn);

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
    const udclient = await userDecksManager.getUserDecksClient(this.user);
    const dynUserDeck = udclient.getDynamicUserDeckDTO();
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
    userdeck: UserDeckDTO
  ): Promise<UserCard[]> {
    // filtered + shuffled + sliced
    const processedUserCards: UserCard[] = [];
    const cards = globalCardsStore.getCardsByDeckId(userdeck.deckId);
    const filteredCards = this.filterCards(cards);
    const shuffledCards = shuffle(filteredCards);
    const slicedCards = slice(shuffledCards);
    for (const card of slicedCards) {
      let dbUserCard = await UserCardsService.createUserCard({
        card: card.id,
        user: this.user.id,
        userDeck: userdeck.id,
      });
      const userCard = new UserCard(dbUserCard, card);
      processedUserCards.push(userCard);
    }
    this.userCards.push(...processedUserCards); // спорный момент
    return processedUserCards;
  }
}

function slice<T>(array: T[]): T[] {
  return array.slice(0, CARDS_COUNT);
}

export type UserCardId = string;
export class UserCard {
  readonly id: UserCardId;
  private readonly _userCard: IUserCard;
  private _cardId: CardId;
  private _userDeckId: UserDeckId;
  private _deleted: boolean;
  private _history: HistoryType[];
  private _showAfter: number;
  private _favorite: boolean;
  private _card: CardDTO;
  constructor(userCard: IUserCard, card: CardDTO) {
    this.id = userCard._id;
    this._userCard = userCard;
    this._cardId = userCard.card;
    this._userDeckId = userCard.userDeck;
    this._deleted = userCard.deleted;
    this._history = userCard.history;
    this._showAfter = userCard.showAfter;
    this._favorite = userCard.favorite;
    this._card = card;
  }
  get card() {
    return this._card;
  }
  get cardId() {
    return this._cardId;
  }
  get userDeckId() {
    return this._userDeckId;
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
  private async setShowAfter(value: number) {
    this._showAfter = value;
    this._userCard.showAfter = value;
    await this._userCard.save();
    return this;
  }
  private async appendToHistory(elem: HistoryType) {
    this._history.push(elem);
    this._userCard.history.push(elem);
    await this._userCard.save();
    return this;
  }
  async learn(status: HistoryStatusEnum): Promise<UserCard> {
    if (Date.now() < this.showAfter) throw new Error("Too early...");
    const newShowAfter = calcShowAfter(status, this.history);
    await this.setShowAfter(newShowAfter);
    await this.appendToHistory({ status, date: Date.now() });
    return this;
  }
  async delete() {
    this._userCard.deleted = true;
    await this._userCard.save();
    return true;
  }
  async setFavorite(value: boolean) {
    this._favorite = value;
    this._userCard.favorite = value;
    await this._userCard.save();
    return this;
  }
}
export class UserCardDTO {
  readonly id: UserCardId;
  readonly cardId: CardId;
  readonly userDeckId: UserDeckId;
  readonly deleted: boolean;
  readonly history: HistoryType[];
  readonly showAfter: number;
  readonly favorite: boolean;
  readonly card: CardDTO;
  constructor(userCard: UserCard) {
    this.id = userCard.id;
    this.cardId = userCard.cardId;
    this.userDeckId = userCard.userDeckId;
    this.deleted = userCard.deleted;
    this.history = userCard.history;
    this.showAfter = userCard.showAfter;
    this.favorite = userCard.favorite;
    this.card = userCard.card;
  }
}

function calcShowAfter(
  status: HistoryStatusEnum,
  history: HistoryType[]
): number {
  let newShowAfter = Date.now();
  const intervalsArray = getIntervalArray(status);
  if (intervalsArray.length == 0) throw new Error("Array cannot be empty"); // ???

  let streak = getStreak(status, history);
  if (streak >= intervalsArray.length) {
    streak = intervalsArray.length - 1;
  }
  newShowAfter += intervalsArray[streak] || 0;
  return newShowAfter;
}
function getIntervalArray(
  status: HistoryStatusEnum,
  hour: number = 1000 * 60 * 60
) {
  const day = hour * 24;
  const hardArray = [hour];
  const mediumArray = [hour * 5, hour * 10];
  const easyArray = [day, day * 3, day * 7, day * 20, day * 50];

  switch (status) {
    case HistoryStatusEnum.easy:
      return easyArray;
    case HistoryStatusEnum.medium:
      return mediumArray;
    case HistoryStatusEnum.hard:
      return hardArray;
    default:
      throw new Error("Invalid status");
  }
}
function getStreak(status: HistoryStatusEnum, history: HistoryType[]) {
  let result = 0;
  let tempHistory = Array.from(history);
  tempHistory.reverse();
  for (let el of tempHistory) {
    if (el.status != status) break;
    result += 1;
  }
  return result;
}

export const userCardsManager = new UserCardsManager();
