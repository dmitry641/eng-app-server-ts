import { ObjId, UploadedFile } from "../../utils/types";
import { User, UserDecksSettings, UserId } from "../users/user";
import {
  DeckPositionEnum,
  DynamicSyncDataType,
  DynamicSyncTypeEnum,
} from "../users/user.util";
import { Deck, globalDecksStore } from "./deck";
import { UserDecksService } from "./decks.service";
import { IUserDeck } from "./models/userDecks.model";

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
  makeUserDeckPublic(userDeckId: UserDeckId): Deck {
    // if dynamic throw error
  }
  addPublicDeckToUserDecks(deckId: DeckId): UserDeck {
    // push to decks
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
  getDynamicDeck(): UserDeck | undefined {
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
  syncDynamicDeck() {
    /*
    // учитывать СкедулДжобс
    продумать ответ сервера с учетом того что синхронизация минуту идёт
    чтобы не ждать, но при этом Кнопка заблокированна
    походу полностью от сокета отказаться не получится
    так как, нет способа сначала ответить 200, когда синхронизация была начата
    А потом через время, прислать что-то на клиент
    (+ сами новые карточки тоже нужно будет досылать)
    (хотя это касается вообще другого модуля, Карточек)
    (так как при добавлении ЦСВ колоды, карточки тоже не досылаются) ПРОИСХОДИТ КАРДС ИНИТ
    (сделать получение карточек при каждом заходе в Флешкардс, без редакса?)
    Не, без редакска не вариант, тогда при каждом переходе будте лоадер.

    Всё вроде ок.
    У нас на фронте dispatch(decksNewDeck) происходит в двух вариантах
    После добавления ЦСВ деки(там без сокета, просто долгая загрузка)
    После создания дин деки. (но при создании у нас не происходит синхронизация)

    БАГ НА ФРОНТЕ. dispatch(decksNewDeck) вызывает Кардс.инит()
    Но только в случае с ДинДек там еще нечего инициализировать
    А в случае с цсв дек, всё ок.




    // сначала проверка на то, что вообще динамическая колода есть
    // обновление ТЕМП ВАЛУЕ/либо настроек
    dynamicSyncMessage: "Processing...",
    dynamicSyncining = true;
    // потом проверка на ЛАСТ АТТЕМПТ + push нововго
    // если ок, то
    ----
    await DeckSyncer.sync(user); [ УПД: ОТМЕНА]
    Этот же класс/метод будет использоваться в Джобс скедуле
    Так как там не важно были ли попытыки синхронизации
    %%% а может и нет. Может стоит переделать логику
    Джоб скедуле. И там вызывать new UserDecksClient().syncDynamicDeck()
    
    const isSynced = await this.syncHandler(user);
    if (isSynced) {
      dynamicSyncMessage: `Last sync at ${new Date().toLocaleTimeString()}`,
    } else {
      dynamicSyncMessage: "Sync error",
      dynamicAutoSync: false,
      
      user.jobs.cancelJob(JOB_DYNAMIC);
    }
    ----
    userSettings.dynamicSyncining = false; // temp value
    */
  }
  async deleteDynamicDeck() {
    const deck = this.getDynamicDeck();
    if (!deck) throw new Error("Dynamic deck doesn't exist");

    await deck.delete();
    this.decks = this.decks.filter((d) => d.id != deck.id);

    await this.settings.setDynamicAutoSync(false);
    await this.settings.setDynamicSyncType(undefined);
    await this.settings.setDynamicSyncData({});
    await this.settings.setDynamicSyncMessage("");
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
    //// Schedule????? update(cancel + create)

    return this.settings;
  }
  async updateAutoSync(value: boolean): Promise<UserDecksSettings> {
    return this.settings.setDynamicAutoSync(value);
  }
}

export type UserDeckId = ObjId;
class UserDeck {
  id: UserDeckId;
  dynamic: boolean;
  enabled: boolean;
  order: number;
  private _userdeck: IUserDeck;
  constructor(userdeck: IUserDeck) {
    this.id = userdeck._id;
    this._userdeck = userdeck;
    this.dynamic = userdeck.dynamic;
    this.enabled = userdeck.enabled;
    this.order = userdeck.order;
  }
  async delete() {
    this._userdeck.deleted = true;
    await this._userdeck.save();
    return true;
  }
  async enable(): Promise<UserDeck> {
    this.enabled = !this.enabled;
    this._userdeck.enabled = this.enabled;
    await this._userdeck.save();
    return this;
  }
  async setOrder(value: number) {
    this.order = value;
    this._userdeck.order = value;
    await this._userdeck.save();
    return this;
  }
}
