import { ObjId, UploadedFile } from "../../utils/types";
import { User, UserDecksSettings, UserId } from "../users/user";
import {
  DeckPositionEnum,
  DynamicSyncDataType,
  DynamicSyncTypeEnum,
} from "../users/user.util";
import { Deck, DeckId, globalDecksStore } from "./deck";
import { UserDecksService } from "./decks.service";
import { IUserDeck } from "./models/userDecks.model";
import {
  SyncClient,
  SYNC_ATTEMPTS_COUNT_LIMIT,
  SYNC_TIMEOUT_LIMIT,
} from "./sync";

class UserDecksStore {
  private userDecksClients = new Map<UserId, UserDecksClient>();
  async getUserDecksClient(user: User): Promise<UserDecksClient> {
    // Нарушение принципов. Гет и сет в одном месте.
    let userDecksClient;
    userDecksClient = this.userDecksClients.get(user.id);
    if (userDecksClient) return userDecksClient;

    const userDecks = await this.getUserDecks(user);
    userDecksClient = new UserDecksClient(userDecks, user);

    this.userDecksClients.set(user.id, userDecksClient);
    return userDecksClient;
  }
  private async getUserDecks(user: User): Promise<UserDeck[]> {
    let userDecks: UserDeck[] = [];
    const models = await UserDecksService.findUserDecks({
      user: user.id,
      deleted: false,
    });
    // FIX ME. Нужно проверить правильно ли отсортировалось
    models.sort((a, b) => a.order - b.order);

    let dynamicExist = false;
    for (let model of models) {
      if (model.dynamic) {
        // очень спорный момент
        if (dynamicExist) throw new Error("Multiple dynamic decks");
        dynamicExist = true;
      }

      const userDeck = new UserDeck(model);
      userDecks.push(userDeck);
    }

    return userDecks;
  }
}
export const globalUserDecksStore = new UserDecksStore();

class UserDecksClient {
  private settings: UserDecksSettings;
  constructor(private decks: UserDeck[], private user: User) {
    this.settings = user.settings.decksSettings;
  }
  getDecks(): UserDeck[] {
    return this.decks;
  }
  private getDeckById(id: UserDeckId): UserDeck | undefined {
    return this.decks.find((d) => d.id === id);
  }
  async enableDeck(id: UserDeckId): Promise<UserDeck> {
    const deck = this.getDeckById(id);
    if (!deck) throw new Error("Deck doesn't exist");
    return deck.enable();
  }
  async deleteDeck(id: UserDeckId) {
    const deck = this.getDeckById(id);
    if (!deck) throw new Error("Deck doesn't exist");
    if (deck.dynamic) throw new Error("Dynamic deck is not allowed");
    await deck.delete();
    this.decks = this.decks.filter((d) => d.id != deck.id);
  }
  async moveDeck(
    id: UserDeckId,
    position: DeckPositionEnum
  ): Promise<UserDeck> {
    const deckOne = this.getDeckById(id);
    if (!deckOne) throw new Error("Deck doesn't exist");

    // FIX ME. Нужно проверить правильно ли отсортировалось
    this.decks.sort((a, b) => a.order - b.order); // спорный момент. Тут оно не нужно, так как они уже должны быть отсортированны
    const currIndex = this.decks.findIndex((d) => d.id == deckOne.id);

    let deckTwo;
    switch (position) {
      case DeckPositionEnum.up:
        deckTwo = this.decks?.[currIndex - 1];
        break;
      case DeckPositionEnum.down:
        deckTwo = this.decks?.[currIndex + 1];
        break;
      default:
        throw new Error("not implemented");
    }
    if (!deckTwo) throw new Error("out of bounds");

    let orderOne = Number(deckOne.order);
    let orderTwo = Number(deckTwo.order);
    await deckTwo.setOrder(orderOne);
    const updated = await deckOne.setOrder(orderTwo);

    // FIX ME. Нужно проверить правильно ли отсортировалось
    this.decks.sort((a, b) => a.order - b.order); // спорный момент
    return updated;
  }
  async toggleUserDeckPublic(userDeckId: UserDeckId): Promise<Deck> {
    const deck = this.getDeckById(userDeckId);
    if (!deck) throw new Error("Deck doesn't exist");
    if (deck.dynamic) throw new Error("Dynamic deck cannot be public");
    return globalDecksStore.toggleDeckPublic(deck);
  }
  async addPublicDeckToUserDecks(deckId: DeckId): Promise<UserDeck> {
    const deck = globalDecksStore.getDeckById(deckId);
    if (!deck) throw new Error("Deck doesn't exist");
    const existed = this.decks.find((d) => d.deckId === deck.id);
    if (existed) throw new Error("Deck already exists");
    // Немного не правильная архитектура. Проблемы с инкапсуляцией.
    // Я могу сделать deck.setPublic(true), хотя не должен мочь, ведь не я владелец этой колоды.
    // Если передовать как ДТО, то можно этого избежать.
    if (!deck.public) throw new Error("Deck is not public");
    const userDeck: UserDeck = await this.newUserDeck(deck);
    return userDeck;
  }

  // не забыть сделать проверку файла. Либо тут либо в контроллере
  async createDeck(file: UploadedFile): Promise<UserDeck> {
    const deck: Deck = await globalDecksStore.createDeck(file, this.user);
    const userDeck: UserDeck = await this.newUserDeck(deck);
    return userDeck;
  }
  private async newUserDeck(deck: Deck): Promise<UserDeck> {
    const order = this.settings.getMaxOrder() + 1;
    await this.settings.setMaxOrder(order);
    const dbUserDeck: IUserDeck = await UserDecksService.createUserDeck({
      user: this.user.id,
      cardsCount: deck.totalCardsCount,
      deck: deck.id,
      order,
    });
    const userDeck = new UserDeck(dbUserDeck);
    this.decks.push(userDeck); // спорный момент
    return userDeck;
  }
  //
  // dynamic
  //
  private getDynamicDeck(): UserDeck | undefined {
    return this.decks.find((d) => d.dynamic);
  }
  async createDynamicDeck(): Promise<UserDeck> {
    const dynDeck = this.getDynamicDeck();
    if (dynDeck) throw new Error("Dynamic deck already exists");
    const deck: Deck = await globalDecksStore.createDynamicDeck(this.user);
    const userDeck = await this.newUserDeck(deck);
    await this.updateAutoSync(true); // спорный момент, нарушение принципов
    return userDeck;
  }
  async syncDynamicDeck(): Promise<{
    settings: UserDecksSettings;
    deck: UserDeck;
  }> {
    const deck = this.getDynamicDeck();
    if (!deck) throw new Error("Dynamic deck doesn't exist");

    await this.tryToResetAttempts();

    const attemptsCount = this.settings.getDynamicSyncAttempts().length;
    if (attemptsCount >= SYNC_ATTEMPTS_COUNT_LIMIT) {
      throw new Error("Too many attempts. Try again later...");
    }

    this.settings.appendDynamicSyncAttempt(Date.now());
    const syncClient = new SyncClient();
    const synced = await syncClient.syncHandler();
    if (synced) {
      await this.settings.setDynamicSyncMessage(
        `Last sync at ${new Date().toLocaleTimeString()}`
      );
    } else {
      await this.settings.setDynamicSyncMessage("Sync error");
      await this.updateAutoSync(false);
      // FIX ME
      // Schedule cancel
    }

    return { settings: this.settings, deck };
  }
  async deleteDynamicDeck(): Promise<UserDecksSettings> {
    // спорный момент
    // в методе "удалить" мы не только удаляем, но еще и настройки изменяем...
    const deck = this.getDynamicDeck();
    if (!deck) throw new Error("Dynamic deck doesn't exist");

    await deck.delete();
    this.decks = this.decks.filter((d) => d.id != deck.id);

    await this.settings.setDynamicAutoSync(false);
    await this.settings.setDynamicSyncType(undefined);
    await this.settings.setDynamicSyncData(undefined);
    await this.settings.setDynamicSyncMessage(undefined);
    this.settings.setDynamicSyncAttempts([]);

    // FIX ME
    // Schedule cancel

    return this.settings;
  }
  async updateSyncDataType(
    type: DynamicSyncTypeEnum,
    data: DynamicSyncDataType
  ): Promise<UserDecksSettings> {
    await this.settings.setDynamicSyncType(type);
    await this.settings.setDynamicSyncData(data);

    // FIX ME
    // Schedule update(cancel + create)

    return this.settings;
  }
  async updateAutoSync(value: boolean): Promise<UserDecksSettings> {
    return this.settings.setDynamicAutoSync(value);
  }

  private async tryToResetAttempts() {
    const lastAttempt = this.settings.getLastDynamicSyncAttempt();
    if (lastAttempt && Date.now() > lastAttempt + SYNC_TIMEOUT_LIMIT) {
      await this.settings.setDynamicSyncMessage(undefined);
      this.settings.setDynamicSyncAttempts([]);
    }
  }
}

export type UserDeckId = ObjId;
export class UserDeck {
  readonly id: UserDeckId;
  private _dynamic: boolean;
  private _enabled: boolean;
  private _order: number;
  private _deckId: DeckId;
  private _userdeck: IUserDeck;
  constructor(userdeck: IUserDeck) {
    this.id = userdeck._id;
    this._userdeck = userdeck;
    this._dynamic = userdeck.dynamic;
    this._enabled = userdeck.enabled;
    this._order = userdeck.order;
    this._deckId = userdeck.deck;
  }
  get dynamic() {
    return this._dynamic;
  }
  get enabled() {
    return this._enabled;
  }
  get order() {
    return this._order;
  }
  get deckId() {
    return this._deckId;
  }
  async delete() {
    this._userdeck.deleted = true;
    await this._userdeck.save();
    return true;
  }
  async enable(): Promise<UserDeck> {
    this._enabled = !this.enabled;
    this._userdeck.enabled = this.enabled;
    await this._userdeck.save();
    return this;
  }
  async setOrder(value: number) {
    this._order = value;
    this._userdeck.order = value;
    await this._userdeck.save();
    return this;
  }
}
