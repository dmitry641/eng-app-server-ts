import { ObjId, UploadedFile } from "../../utils/types";
import { User, UserDecksSettings, UserId } from "../users/user";
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

      const userDeck = UserDeckFactory.create(model);
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
  enableDeck(): UserDeck {}
  deleteDeck(): UserDeck {
    // if dynamic this.deleteDynamicDeck()
  }
  moveDeck(): UserDeck {
    // moveUp/moveDown?
    // +sort by order? (a, b) => a.order - b.order
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
    const userDeck = UserDeckFactory.create(dbUserDeck);
    this.decks.push(userDeck); // спорный момент
    return userDeck;
  }
  //
  // dynamic
  //
  getDynamicDeck(): UserDynamicDeck | undefined {
    const dynDeck = this.decks.find((d) => d instanceof UserDynamicDeck);
    if (!dynDeck) return undefined;
    return dynDeck as UserDynamicDeck; // костыль???
  }
  async createDynamicDeck(): Promise<UserDynamicDeck> {
    const dynDeck = this.getDynamicDeck();
    if (dynDeck) throw new Error("Dynamic deck already exists");
    const deck: Deck = await globalDecksStore.createDynamicDeck(this.user);
    const userDeck: UserDynamicDeck = await this.newUserDeck(deck);
    return userDeck;
    // тут вроде понятно. Мы просто возвращаем DynamicUserDeck
    // сразу без задержек. НО ВСЁ ЖЕ. Как быть с настройками??
    // убрать их отсюда???
    // а как быть на фронте после нажатия СЕЙВ
    /*
    settingsUpdate.dynamicType = TYPE factory
    settingsUpdate.dynamicAutoSync = true;
    deck = await deckCreator.dynamicDeck(req.user);

    // ОТ ЭТОГО ТОЖЕ МОЖНО ОТКАЗАТЬСЯ
    // просто шлем в ответ НЬЮ ДЕК и всё 
    ( НО КАК БЫТЬ С НАСТРОЙКАМИ, как обновить их на клиенте)
    Если 200, то ... не это бред
    Слать в ответ {deck, settings} ?
    socketUtil.sendMsgToUser(
      "new-deck",
      req.user.id,
      JSON.stringify(deck.toDTO())
    );
    switch (type) {
      ....... factory
      settingsUpdate.dynamicAccountName = data?.email || data;
    } 
    const updatedSettings = await req.user.updateSettings(settingsUpdate);
    req.user.jobs.create(JOB_DYNAMIC, JOB_TYPES.deckSync, {
      enable: updatedSettings.dynamicAutoSync,
    });
    res.json(updatedSettings);
    */
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
  private deleteDynamicDeck(): UserDynamicDeck {
    // + filter decks
    /*
        let settings = await req.user.updateSettings({
          dynamicAutoSync: false,
          dynamicType: "",
          dynamicAccountName: "",
          dynamicSyncMessage: "",
          dynamicSyncAttempts: [],
        });

        socketUtil.sendMsgToUser(
          "settings-update",
          req.user.id,
          JSON.stringify(settings)
        );

        req.user.jobs.cancelJob(JOB_DYNAMIC);
    
    */
  }
  updateDynamicDeck(type, data) {
    // подругому. Отдельные методы? у дексСеттингс?
    /*
    settingsUpdate.dynamicType = TYPE factory
    switch (type) {
      ....... factory
      settingsUpdate.dynamicAccountName = data?.email || data;
    } 
    const updatedSettings = await req.user.updateSettings(settingsUpdate);
    req.user.jobs.update(JOB_DYNAMIC, JOB_TYPES.deckSync, {
      enable: updatedSettings.dynamicAutoSync,
    });
    res.json(updatedSettings);
    */
  }
}

class UserDeckFactory {
  static create(dbDeck: IUserDeck): UserDynamicDeck {
    if (dbDeck.dynamic) {
      return new UserDynamicDeck(dbDeck);
    }
    return new UserDeck(dbDeck);
  }
}

export type UserDeckId = ObjId;
class UserDeck {
  id: UserDeckId;
  private _userdeck: IUserDeck;
  constructor(userdeck: IUserDeck) {
    this.id = userdeck._id;
    this._userdeck = userdeck;
  }
  delete() {}
  enable() {}
  changeOrder() {}
}

class UserDynamicDeck extends UserDeck {
  sync() {}
}
