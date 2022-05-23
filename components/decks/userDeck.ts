import { UploadedFile } from "../../utils/types";
import { globalJobStore } from "../schedule";
import { UserJobTypesEnum } from "../schedule/types";
import {
  User,
  UserDecksSettings,
  UserDecksSettingsDTO,
  UserId,
} from "../users/user";
import {
  DynamicSyncData,
  DynamicSyncType,
  UserDeckPositionEnum,
} from "../users/user.util";
import { DeckDTO, DeckId, globalDecksStore } from "./deck";
import { IUserDeck } from "./models/userDecks.model";
import { UserDecksService } from "./services/userDecks.service";
import {
  SyncClient,
  SYNC_ATTEMPTS_COUNT_LIMIT,
  SYNC_TIMEOUT_LIMIT,
} from "./sync";

class UserDecksManager {
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
    const dbUserDecks = await UserDecksService.findUserDecks({
      user: user.id,
      deleted: false,
    });
    dbUserDecks.sort(ascSortByOrderFn);

    let dynamicExist = false;
    for (let dbUserDeck of dbUserDecks) {
      if (dbUserDeck.dynamic) {
        // очень спорный момент
        if (dynamicExist) throw new Error("Multiple dynamic decks");
        dynamicExist = true;
      }
      const deck = globalDecksStore.getDeckById(dbUserDeck.deck);
      const userDeck = new UserDeck(dbUserDeck, deck);
      userDecks.push(userDeck);
    }

    return userDecks;
  }
}

export class UserDecksClient {
  private settings: UserDecksSettings;
  constructor(private userDecks: UserDeck[], private user: User) {
    this.settings = user.settings.userDecksSettings;
  }
  private settingsToDTO(): UserDecksSettingsDTO {
    return new UserDecksSettingsDTO(this.settings);
  }
  getUserDecksSettings(): UserDecksSettingsDTO {
    return this.settingsToDTO();
  }
  getUserDecks(): UserDeckDTO[] {
    return this.userDecks.map((ud) => this.userDeckToDTO(ud));
  }
  getUserDeckById(userDeckId: UserDeckId): UserDeckDTO {
    const userDeck = this.getUserDeck(userDeckId);
    return this.userDeckToDTO(userDeck);
  }
  private userDeckToDTO(userDeck: UserDeck): UserDeckDTO {
    return new UserDeckDTO(userDeck);
  }
  private getUserDeck(userDeckId: UserDeckId): UserDeck {
    const userDeck = this.userDecks.find((ud) => ud.id === userDeckId);
    if (!userDeck) throw new Error("UserDeck doesn't exist");
    return userDeck;
  }
  async enableUserDeck(userDeckId: UserDeckId): Promise<UserDeckDTO> {
    const userDeck = this.getUserDeck(userDeckId);
    await userDeck.enable();
    return this.userDeckToDTO(userDeck);
  }
  async deleteUserDeck(userDeckId: UserDeckId): Promise<UserDeckDTO> {
    const userDeck = this.getUserDeck(userDeckId);
    if (userDeck.dynamic) throw new Error("Dynamic deck is not allowed");
    await userDeck.delete();
    this.userDecks = this.userDecks.filter((d) => d.id != userDeck.id);
    return this.userDeckToDTO(userDeck);
  }
  async moveUserDeck(
    userDeckId: UserDeckId,
    position: UserDeckPositionEnum
  ): Promise<UserDeckDTO> {
    const userDeckOne = this.getUserDeck(userDeckId);

    // спорный момент. Вероятно не нужно, так как они уже должны быть отсортированны
    this.userDecks.sort(ascSortByOrderFn);
    const currIndex = this.userDecks.findIndex((d) => d.id == userDeckOne.id);

    let userDeckTwo;
    switch (position) {
      case UserDeckPositionEnum.up:
        userDeckTwo = this.userDecks?.[currIndex - 1];
        break;
      case UserDeckPositionEnum.down:
        userDeckTwo = this.userDecks?.[currIndex + 1];
        break;
      default:
        throw new Error("not implemented");
    }
    if (!userDeckTwo) return this.userDeckToDTO(userDeckOne); // out of bounds

    let orderOne = Number(userDeckOne.order);
    let orderTwo = Number(userDeckTwo.order);
    await userDeckTwo.setOrder(orderOne);
    await userDeckOne.setOrder(orderTwo);

    this.userDecks.sort(ascSortByOrderFn);
    return this.userDeckToDTO(userDeckOne);
  }
  async toggleUserDeckPublic(userDeckId: UserDeckId): Promise<DeckDTO> {
    const userDeck = this.getUserDeck(userDeckId);
    if (userDeck.dynamic) throw new Error("Dynamic deck cannot be public");
    const dto = this.userDeckToDTO(userDeck);
    return globalDecksStore.toggleDeckPublic(dto);
  }
  async addPublicDeckToUserDecks(deckId: DeckId): Promise<UserDeckDTO> {
    const deck = globalDecksStore.getDeckById(deckId);
    const existed = this.userDecks.find((d) => d.deckId === deck.id);
    if (existed) throw new Error("Deck already exists in userDecks");
    if (!deck.public) throw new Error("Deck is not public");
    const userDeck: UserDeck = await this.newUserDeck(deck);
    return this.userDeckToDTO(userDeck);
  }
  getPublicDecks(): DeckDTO[] {
    const decks = globalDecksStore.getPublicDecks();
    const existedIds = this.userDecks.map((d) => d.deckId);
    const filteredDecks = decks.filter((d) => !existedIds.includes(d.id));
    return filteredDecks;
  }
  async createUserDeck(file: UploadedFile): Promise<UserDeckDTO> {
    const deck = await globalDecksStore.createDeck(file, this.user);
    const userDeck: UserDeck = await this.newUserDeck(deck);
    return this.userDeckToDTO(userDeck);
  }
  createZipUserDeck() {
    throw new Error("not implemented");
  }
  private async newUserDeck(
    deck: DeckDTO,
    dynamic: boolean = false
  ): Promise<UserDeck> {
    const order = this.settings.maxOrder + 1;
    await this.settings.setMaxOrder(order);
    const dbUserDeck: IUserDeck = await UserDecksService.createUserDeck({
      user: this.user.id,
      cardsCount: deck.totalCardsCount,
      deck: deck.id,
      order,
      dynamic,
    });
    const userDeck = new UserDeck(dbUserDeck, deck);
    this.userDecks.push(userDeck); // спорный момент
    return userDeck;
  }
  // --------Dynamic--------
  getDynamicUserDeckDTO(): UserDeckDTO | undefined {
    let dynUserDeck = this.getDynamicUserDeck();
    if (!dynUserDeck) return undefined;
    return this.userDeckToDTO(dynUserDeck);
  }
  private getDynamicUserDeck(): UserDeck | undefined {
    return this.userDecks.find((d) => d.dynamic);
  }
  async createDynamicUserDeck(): Promise<UserDeckDTO> {
    const dynUserDeck = this.getDynamicUserDeck();
    if (dynUserDeck) throw new Error("Dynamic userDeck already exists");
    const deck = await globalDecksStore.createDynamicDeck(this.user);
    const userDeck = await this.newUserDeck(deck, true);
    await this.updateAutoSync(true); // спорный момент, нарушение принципов
    return this.userDeckToDTO(userDeck);
  }
  async syncDynamicUserDeck(): Promise<{
    settings: UserDecksSettingsDTO;
    userDeck: UserDeckDTO;
  }> {
    const dynUserDeck = this.getDynamicUserDeck();
    if (!dynUserDeck) throw new Error("Dynamic userDeck doesn't exist");
    const type = this.settings.dynamicSyncType;
    if (!type) throw new Error("DynamicSyncType is undefined");
    const data = this.settings.dynamicSyncData;
    if (!data) throw new Error("DynamicSyncData is undefined");

    await this.tryToResetAttempts();

    const attemptsCount = this.settings.dynamicSyncAttempts.length;
    if (attemptsCount >= SYNC_ATTEMPTS_COUNT_LIMIT) {
      throw new Error("Too many attempts. Try again later...");
    }

    this.settings.appendDynamicSyncAttempt(Date.now());
    const syncClient = new SyncClient(type, data);
    const synced = await syncClient.syncHandler(dynUserDeck);
    if (synced) {
      await this.settings.setDynamicSyncMessage(
        `Last sync at ${new Date().toLocaleTimeString()}`
      );
    } else {
      await this.settings.setDynamicSyncMessage("Sync error");
      await this.updateAutoSync(false);
      globalJobStore.userJobs.cancelJob(this.user, "deckSyncJob");
    }

    return {
      settings: this.settingsToDTO(),
      userDeck: this.userDeckToDTO(dynUserDeck),
    };
  }
  async deleteDynamicUserDeck(): Promise<UserDecksSettingsDTO> {
    // спорный момент. В методе "удалить" мы не только удаляем, но еще и настройки изменяем...
    const dynUserDeck = this.getDynamicUserDeck();
    if (!dynUserDeck) throw new Error("Dynamic userDeck doesn't exist");
    await dynUserDeck.delete();
    this.userDecks = this.userDecks.filter((d) => d.id != dynUserDeck.id);

    await this.settings.setDynamicAutoSync(false);
    await this.settings.setDynamicSyncType(undefined);
    await this.settings.setDynamicSyncData(undefined);
    await this.settings.setDynamicSyncMessage(undefined);
    this.settings.setDynamicSyncAttempts([]);

    globalJobStore.userJobs.cancelJob(this.user, "deckSyncJob");

    return this.settingsToDTO();
  }
  async updateSyncDataType(
    type: DynamicSyncType,
    data: DynamicSyncData
  ): Promise<UserDecksSettingsDTO> {
    await this.settings.setDynamicSyncType(type);
    await this.settings.setDynamicSyncData(data);

    globalJobStore.userJobs.updateJob(
      this.user,
      "deckSyncJob",
      UserJobTypesEnum.deckSync
    );

    return this.settingsToDTO();
  }
  async updateAutoSync(value: boolean): Promise<UserDecksSettingsDTO> {
    globalJobStore.userJobs.updateJob(
      this.user,
      "deckSyncJob",
      UserJobTypesEnum.deckSync
    );
    await this.settings.setDynamicAutoSync(value);
    return this.settingsToDTO();
  }
  private async tryToResetAttempts() {
    const lastAttempt = this.settings.getLastDynamicSyncAttempt();
    if (lastAttempt && Date.now() > lastAttempt + SYNC_TIMEOUT_LIMIT) {
      await this.settings.setDynamicSyncMessage(undefined);
      this.settings.setDynamicSyncAttempts([]);
    }
  }
  // --------Cards--------
  async updateCardsLearned(
    userDeckId: UserDeckId,
    value: number
  ): Promise<UserDeckDTO> {
    const userDeck = this.getUserDeck(userDeckId);
    await userDeck.setCardsLearned(value);
    return this.userDeckToDTO(userDeck);
  }
  async updateCardsCount(
    userDeckId: UserDeckId,
    value: number
  ): Promise<UserDeckDTO> {
    const userDeck = this.getUserDeck(userDeckId);
    await userDeck.setCardsCount(value);
    return this.userDeckToDTO(userDeck);
  }
}

export type UserDeckId = string;
export class UserDeck {
  readonly id: UserDeckId;
  private readonly _userdeck: IUserDeck;
  private _deckId: DeckId;
  private _dynamic: boolean;
  private _enabled: boolean;
  private _deleted: boolean;
  private _order: number;
  private _cardsCount: number;
  private _cardsLearned: number;
  private _deckName: string;
  constructor(userdeck: IUserDeck, deck: DeckDTO) {
    this.id = String(userdeck._id);
    this._userdeck = userdeck;
    this._deckId = String(userdeck.deck);
    this._dynamic = userdeck.dynamic;
    this._enabled = userdeck.enabled;
    this._deleted = userdeck.deleted;
    this._order = userdeck.order;
    this._cardsCount = userdeck.cardsCount;
    this._cardsLearned = userdeck.cardsLearned;
    this._deckName = deck.name;
  }
  get deckId() {
    return this._deckId;
  }
  get dynamic() {
    return this._dynamic;
  }
  get enabled() {
    return this._enabled;
  }
  get deleted() {
    return this._deleted;
  }
  get order() {
    return this._order;
  }
  get cardsCount() {
    return this._cardsCount;
  }
  get cardsLearned() {
    return this._cardsLearned;
  }
  get deckName() {
    return this._deckName;
  }
  async delete() {
    this._deleted = true;
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
  async setOrder(value: number): Promise<UserDeck> {
    this._order = value;
    this._userdeck.order = value;
    await this._userdeck.save();
    return this;
  }
  async setCardsCount(value: number): Promise<UserDeck> {
    this._cardsCount = value;
    this._userdeck.cardsCount = value;
    await this._userdeck.save();
    return this;
  }
  async setCardsLearned(value: number): Promise<UserDeck> {
    this._cardsLearned = value;
    this._userdeck.cardsLearned = value;
    await this._userdeck.save();
    return this;
  }
}
export class UserDeckDTO {
  readonly id: string;
  readonly deckId: string;
  readonly dynamic: boolean;
  readonly enabled: boolean;
  readonly deleted: boolean;
  readonly order: number;
  readonly cardsCount: number;
  readonly cardsLearned: number;
  readonly deckName: string;
  constructor(userDeck: UserDeck) {
    this.id = userDeck.id;
    this.deckId = userDeck.deckId;
    this.dynamic = userDeck.dynamic;
    this.enabled = userDeck.enabled;
    this.deleted = userDeck.deleted;
    this.order = userDeck.order;
    this.cardsCount = userDeck.cardsCount;
    this.cardsLearned = userDeck.cardsLearned;
    this.deckName = userDeck.deckName;
  }
}

export const ascSortByOrderFn = <T extends { order: number }>(a: T, b: T) =>
  a.order - b.order;

export const userDecksManager = new UserDecksManager();
