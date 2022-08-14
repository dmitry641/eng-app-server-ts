import { FilterQuery } from "mongoose";
import { getCsvData } from "../../utils";
import { cardsCsvHeaders, CardsKeysType } from "../flashcards/flashcards.util";
import { globalJobStore } from "../schedule";
import { UserJobTypesEnum } from "../schedule/types";
import { userService } from "../users/users.service";
import {
  ascSortByOrderFn,
  DeckDTO,
  DecksSettingsDTO,
  DynamicSyncType,
  UploadedFile,
  UserDeckDTO,
  UserDeckPositionEnum,
} from "./decks.util";
import { DeckInput, DeckModel, IDeck } from "./models/decks.model";
import {
  DecksSettingsModel,
  IDecksSettings,
} from "./models/decksSettings.model";
import {
  IUserDeck,
  UserDeckInput,
  UserDeckModel,
} from "./models/userDecks.model";
import {
  SyncClient,
  SYNC_ATTEMPTS_COUNT_LIMIT,
  SYNC_TIMEOUT_LIMIT,
} from "./sync";

export class DecksService {
  async getUserDecks(userId: string): Promise<UserDeckDTO[]> {
    const userDecks = await this.findIUserDecks(userId);
    const DTOs = [];
    for (const ud of userDecks) {
      const dto = await this.userDeckToDTO(ud);
      DTOs.push(dto);
    }
    return DTOs;
  }
  async createUserDeck(
    userId: string,
    file: UploadedFile
  ): Promise<UserDeckDTO> {
    const filename = file.originalname.replace(".csv", "");
    const rawCards = await getCsvData<CardsKeysType>(
      file.buffer,
      cardsCsvHeaders,
      [true, false, true, false],
      ","
    );

    const user = await userService.getUser(userId);
    const deckInput: DeckInput = {
      createdBy: userId,
      name: filename,
      totalCardsCount: rawCards.length,
    };
    const deck = await this.newDeck(deckInput);

    // FIXME
    // await cardsService.createCards(rawCards, deck);

    const userDeck = await this.newUserDeck(userId, deck);
    return this.userDeckToDTO(userDeck);
  }
  async enableUserDeck(
    userId: string,
    userDeckId: string
  ): Promise<UserDeckDTO> {
    const userDeck = await this.findOneIUserDeck(userId, userDeckId);
    userDeck.enabled = !userDeck.enabled;
    await userDeck.save();
    return this.userDeckToDTO(userDeck);
  }
  async deleteUserDeck(userId: string, userDeckId: string): Promise<boolean> {
    const userDeck = await this.findOneIUserDeck(userId, userDeckId);
    if (userDeck.dynamic) throw new Error("Dynamic deck is not allowed");
    userDeck.deleted = true;
    await userDeck.save();
    return true;
  }
  async moveUserDeck(
    userId: string,
    userDeckId: string,
    position: UserDeckPositionEnum
  ): Promise<UserDeckDTO> {
    const userDeckOne = await this.findOneIUserDeck(userId, userDeckId);

    // спорный момент. Вероятно не нужно, так как они уже должны быть отсортированны
    const userDecks = await this.findIUserDecks(userId);
    userDecks.sort(ascSortByOrderFn);
    const currIndex = userDecks.findIndex(
      (ud) => String(ud._id) === String(userDeckOne._id)
    );

    let userDeckTwo;
    switch (position) {
      case UserDeckPositionEnum.up:
        userDeckTwo = userDecks?.[currIndex - 1];
        break;
      case UserDeckPositionEnum.down:
        userDeckTwo = userDecks?.[currIndex + 1];
        break;
      default:
        throw new Error("not implemented");
    }
    if (!userDeckTwo) return this.userDeckToDTO(userDeckOne); // out of bounds

    let orderOne = Number(userDeckOne.order);
    let orderTwo = Number(userDeckTwo.order);
    userDeckTwo.order = orderOne;
    await userDeckTwo.save();
    userDeckOne.order = orderTwo;
    await userDeckOne.save();

    userDecks.sort(ascSortByOrderFn);
    return this.userDeckToDTO(userDeckOne);
  }
  async publishUserDeck(
    userId: string,
    userDeckId: string
  ): Promise<UserDeckDTO> {
    const userDeck = await this.findOneIUserDeck(userId, userDeckId);
    if (userDeck.dynamic) throw new Error("Dynamic deck cannot be public");
    const deck = await this.findOneIDeck(String(userDeck.deck));
    if (String(userDeck.user) !== String(deck.createdBy)) {
      throw new Error("Only the owner can make changes");
    }
    deck.public = !deck.public;
    await deck.save();
    return this.userDeckToDTO(userDeck);
  }
  async getPublicDecks(userId: string): Promise<DeckDTO[]> {
    const decks = await this.findIDecks({ public: true });
    const userDecks = await this.findIUserDecks(userId);
    const existedIds = userDecks.map((ud) => String(ud.deck));
    const filteredDecks = decks.filter(
      (d) => !existedIds.includes(String(d._id))
    );
    const DTOs = [];
    for (const d of filteredDecks) {
      const dto = await this.deckToDTO(d);
      DTOs.push(dto);
    }
    return DTOs;
  }
  async addPublicDeck(userId: string, deckId: string): Promise<UserDeckDTO> {
    const deck = await this.findOneIDeck(deckId);
    const userDecks = await this.findIUserDecks(userId);
    const existed = userDecks.find(
      (ud) => String(ud.deck) === String(deck._id)
    );
    if (existed) throw new Error("Deck is already existed in userDecks");
    if (!deck.public) throw new Error("Deck cannot be added");
    const userDeck = await this.newUserDeck(userId, deck);
    return this.userDeckToDTO(userDeck);
  }
  async createDynamicUserDeck(userId: string): Promise<UserDeckDTO> {
    const existed = await this.findDynamicUserDeck(userId);
    if (existed) throw new Error("Dynamic userDeck already exists");

    const user = await userService.getUser(userId);
    const deckInput: DeckInput = {
      createdBy: userId,
      name: "Dynamic deck",
      totalCardsCount: 0, // спорный момент
    };
    const deck = await this.newDeck(deckInput);
    const dynUserDeck = await this.newUserDeck(userId, deck, true);

    const settings = await this.findDecksSettings(userId);
    await this.updateAutoSync(userId, true); // спорный момент, нарушение принципов
    settings.dynamicCreated = true;
    await settings.save();

    return this.userDeckToDTO(dynUserDeck);
  }
  async deleteDynamicUserDeck(userId: string): Promise<boolean> {
    // спорный момент. В методе "удалить" мы не только удаляем, но еще и настройки изменяем...
    const dynUserDeck = await this.findDynamicUserDeck(userId);
    if (!dynUserDeck) throw new Error("Dynamic userDeck doesn't exist");
    dynUserDeck.deleted = true;
    await dynUserDeck.save();

    const settings = await this.findDecksSettings(userId);
    settings.dynamicAutoSync = false;
    settings.dynamicCreated = false;
    settings.dynamicSyncType = undefined;
    settings.dynamicSyncLink = undefined;
    settings.dynamicSyncMessage = undefined;
    settings.dynamicSyncAttempts = [];
    await settings.save();

    globalJobStore.userJobs.cancelJob(userId, "deckSyncJob");

    return true;
  }
  async syncDynamicUserDeck(userId: string): Promise<UserDeckDTO> {
    const dynUserDeck = await this.findDynamicUserDeck(userId);
    if (!dynUserDeck) throw new Error("Dynamic userDeck doesn't exist");
    const settings = await this.findDecksSettings(userId);
    const type = settings.dynamicSyncType;
    if (!type) throw new Error("DynamicSyncType is undefined");
    const link = settings.dynamicSyncLink;
    if (!link) throw new Error("DynamicSyncLink is undefined");

    const lastAttempt = settings.dynamicSyncAttempts.at(-1);
    if (lastAttempt && Date.now() > lastAttempt + SYNC_TIMEOUT_LIMIT) {
      settings.dynamicSyncMessage = undefined;
      settings.dynamicSyncAttempts = [];
    }

    const attemptsCount = settings.dynamicSyncAttempts.length;
    if (attemptsCount >= SYNC_ATTEMPTS_COUNT_LIMIT) {
      throw new Error("Too many attempts. Try again later...");
    }

    settings.dynamicSyncAttempts.push(Date.now());

    const syncClient = new SyncClient(type, link);
    const [synced, msg] = await syncClient.syncHandler(dynUserDeck); // FIXME не UserDeck, а IUserDeck
    if (synced) {
      settings.dynamicSyncMessage = `Last sync at ${new Date().toLocaleTimeString()}`;
    } else {
      settings.dynamicSyncMessage = msg || "Sync error";
      settings.dynamicAutoSync = false;
      globalJobStore.userJobs.cancelJob(userId, "deckSyncJob");
    }

    await settings.save();

    return this.userDeckToDTO(dynUserDeck);
  }
  async getDecksSettings(userId: string): Promise<DecksSettingsDTO> {
    const settings = await this.findDecksSettings(userId);
    return this.settingsToDTO(settings);
  }
  async updateSyncData(
    userId: string,
    type: DynamicSyncType,
    link: string
  ): Promise<DecksSettingsDTO> {
    const settings = await this.findDecksSettings(userId);
    settings.dynamicSyncType = type;
    settings.dynamicSyncLink = link;
    await settings.save();

    globalJobStore.userJobs.updateJob(
      userId,
      "deckSyncJob",
      UserJobTypesEnum.deckSync
    );

    return this.settingsToDTO(settings);
  }
  async updateAutoSync(
    userId: string,
    value: boolean
  ): Promise<DecksSettingsDTO> {
    const settings = await this.findDecksSettings(userId);
    globalJobStore.userJobs.updateJob(
      userId,
      "deckSyncJob",
      UserJobTypesEnum.deckSync
    );
    settings.dynamicAutoSync = value;
    await settings.save();
    return this.settingsToDTO(settings);
  }
  createZipUserDeck() {
    throw new Error("not implemented");
  }
  private async findDynamicUserDeck(
    userId: string
  ): Promise<IUserDeck | undefined> {
    const userDecks = await this.findIUserDecks(userId);
    const dynUserDeck = userDecks.find((ud) => ud.dynamic);
    return dynUserDeck;
  }
  private async findIDecks(query: FilterQuery<IDeck>) {
    return DeckModel.find(query);
  }
  private async findOneIDeck(deckId: string): Promise<IDeck> {
    const deck = await DeckModel.findOne({ _id: deckId });
    if (!deck) throw new Error("Deck doesn't exist");
    return deck;
  }
  private async findIUserDecks(userId: string): Promise<IUserDeck[]> {
    return UserDeckModel.find({
      user: userId,
      deleted: false,
    });
  }
  private async findOneIUserDeck(
    userId: string,
    userDeckId: string
  ): Promise<IUserDeck> {
    const userDeck = await UserDeckModel.findOne({
      user: userId,
      _id: userDeckId,
      deleted: false,
    });
    if (!userDeck) throw new Error("UserDeck doesn't exist");
    return userDeck;
  }
  private async findDecksSettings(userId: string): Promise<IDecksSettings> {
    const settings = await DecksSettingsModel.findOne({ user: userId });
    if (!settings) throw new Error("DecksSettings doesn't exist");
    return settings;
  }
  private async newDeck(deckInput: DeckInput): Promise<IDeck> {
    return DeckModel.create(deckInput);
  }
  private async newUserDeck(
    userId: string,
    deck: IDeck,
    dynamic: boolean = false
  ): Promise<IUserDeck> {
    const settings = await this.findDecksSettings(userId);
    const newOrder = settings.maxOrder + 1;
    settings.maxOrder = newOrder;
    await settings.save();

    const userDeckInput: UserDeckInput = {
      user: userId,
      deck: deck.id,
      order: newOrder,
      cardsCount: deck.totalCardsCount,
      dynamic,
    };
    const userDeck = await UserDeckModel.create(userDeckInput);

    return userDeck;
  }
  private async deckToDTO(deck: IDeck): Promise<DeckDTO> {
    const user = await userService.getUser(String(deck.createdBy));
    return new DeckDTO(deck, user);
  }
  private async userDeckToDTO(userDeck: IUserDeck): Promise<UserDeckDTO> {
    const deck = await this.findOneIDeck(String(userDeck.deck));
    const deckDTO = await this.deckToDTO(deck);
    return new UserDeckDTO(userDeck, deckDTO);
  }
  private settingsToDTO(settings: IDecksSettings): DecksSettingsDTO {
    return new DecksSettingsDTO(settings);
  }
}

export const decksService = new DecksService();
