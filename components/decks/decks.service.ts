import { FilterQuery } from "mongoose";
import { getCsvData } from "../../utils";
import { cardsService } from "../cards/cards.service";
import { CardsKeysType, cardsCsvHeaders } from "../cards/cards.util";
import { userService } from "../users/users.service";
import {
  DeckDTO,
  UDPositionEnum,
  UploadedFile,
  UserDeckDTO,
} from "./decks.util";
import { DeckInput, DeckModel, IDeck } from "./models/decks.model";
import {
  IUserDeck,
  UserDeckInput,
  UserDeckModel,
} from "./models/userDecks.model";

export class DecksService {
  async getUserDecks(userId: string): Promise<UserDeckDTO[]> {
    const userDecks = await this.findIUserDecks(userId);
    return this.userDeckToDTO(userDecks);
  }
  async createUserDeck(
    userId: string,
    file: UploadedFile
  ): Promise<UserDeckDTO> {
    const filename = file.originalname.replace(".csv", "");
    const rawCards = await getCsvData<CardsKeysType>(
      file.buffer,
      cardsCsvHeaders,
      [true, false, true, true],
      ","
    );

    const deckInput: DeckInput = {
      createdBy: userId,
      name: filename,
      totalCardsCount: rawCards.length,
    };
    const deck = await this.newDeck(deckInput);
    const deckDTO = await this.deckToDTO(deck);
    await cardsService.createCards(rawCards, deckDTO);

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
  async deleteUserDeck(
    userId: string,
    userDeckId: string
  ): Promise<UserDeckDTO> {
    const userDeck = await this.findOneIUserDeck(userId, userDeckId);
    userDeck.deleted = true;
    await userDeck.save();
    return this.userDeckToDTO(userDeck);
  }
  async moveUserDeck(
    userId: string,
    userDeckId: string,
    position: UDPositionEnum
  ): Promise<UserDeckDTO> {
    const userDeckOne = await this.findOneIUserDeck(userId, userDeckId);

    const userDecks = await this.findIUserDecks(userId);
    const currIndex = userDecks.findIndex(
      (ud) => String(ud._id) === String(userDeckOne._id)
    );

    let userDeckTwo;
    switch (position) {
      case UDPositionEnum.up:
        userDeckTwo = userDecks?.[currIndex - 1];
        break;
      case UDPositionEnum.down:
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

    return this.userDeckToDTO(userDeckOne);
  }
  async publishUserDeck(
    userId: string,
    userDeckId: string
  ): Promise<UserDeckDTO> {
    const userDeck = await this.findOneIUserDeck(userId, userDeckId);
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
    return this.deckToDTO(filteredDecks);
  }
  async addPublicDeck(userId: string, deckId: string): Promise<UserDeckDTO> {
    const deck = await this.findOneIDeck(deckId); // {public:true}
    if (!deck.public) throw new Error("Deck cannot be added");
    const userDecks = await this.findIUserDecks(userId);
    const existed = userDecks.find(
      (ud) => String(ud.deck) === String(deck._id)
    );
    if (existed) throw new Error("Deck is already existed in userDecks");
    const userDeck = await this.newUserDeck(userId, deck);
    return this.userDeckToDTO(userDeck);
  }

  createZipUserDeck() {
    throw new Error("not implemented");
  }
  async getDeckById(deckId: string): Promise<DeckDTO> {
    const deck = await this.findOneIDeck(deckId);
    return this.deckToDTO(deck);
  }
  // спорно
  async decrementCardsCount(
    userId: string,
    userDeckId: string
  ): Promise<UserDeckDTO | undefined> {
    let userDeck;
    try {
      userDeck = await this.findOneIUserDeck(userId, userDeckId);
      userDeck.cardsCount = userDeck.cardsCount - 1;
      await userDeck.save();
    } catch (error) {}

    if (userDeck) return this.userDeckToDTO(userDeck);
    return undefined;
  }
  // спорно
  async incrementCardsLearned(
    userId: string,
    userDeckId: string
  ): Promise<UserDeckDTO | undefined> {
    let userDeck;
    try {
      userDeck = await this.findOneIUserDeck(userId, userDeckId);
      userDeck.cardsLearned = userDeck.cardsLearned + 1;
      await userDeck.save();
    } catch (error) {}

    if (userDeck) return this.userDeckToDTO(userDeck);
    return undefined;
  }

  private async findIDecks(query: FilterQuery<IDeck>) {
    return DeckModel.find(query);
  }
  private async findOneIDeck(deckId: string): Promise<IDeck> {
    // FilterQuery<IDeck>
    const deck = await DeckModel.findOne({ _id: deckId });
    if (!deck) throw new Error("Deck doesn't exist");
    return deck;
  }
  private async findIUserDecks(userId: string): Promise<IUserDeck[]> {
    return UserDeckModel.find({
      user: userId,
      deleted: false,
    }).sort("order");
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
  private async newDeck(deckInput: DeckInput): Promise<IDeck> {
    return DeckModel.create(deckInput);
  }
  private async newUserDeck(userId: string, deck: IDeck): Promise<IUserDeck> {
    const userDecks = await this.findIUserDecks(userId);
    const newOrder = getMaxOrder(userDecks) + 1;

    const userDeckInput: UserDeckInput = {
      user: userId,
      deck: deck.id,
      order: newOrder,
      cardsCount: deck.totalCardsCount,
    };
    const userDeck = await UserDeckModel.create(userDeckInput);

    return userDeck;
  }
  private async deckToDTO(deck: IDeck): Promise<DeckDTO>;
  private async deckToDTO(deck: IDeck[]): Promise<DeckDTO[]>;
  private async deckToDTO(deck: IDeck | IDeck[]): Promise<DeckDTO | DeckDTO[]> {
    if (Array.isArray(deck)) {
      const DTOs: DeckDTO[] = [];
      for (const d of deck) {
        const user = await userService.getUser(String(d.createdBy));
        DTOs.push(new DeckDTO(d, user));
      }
      return DTOs;
    } else {
      const user = await userService.getUser(String(deck.createdBy));
      return new DeckDTO(deck, user);
    }
  }
  private async userDeckToDTO(userDeck: IUserDeck): Promise<UserDeckDTO>;
  private async userDeckToDTO(userDeck: IUserDeck[]): Promise<UserDeckDTO[]>;
  private async userDeckToDTO(
    userDeck: IUserDeck | IUserDeck[]
  ): Promise<UserDeckDTO | UserDeckDTO[]> {
    if (Array.isArray(userDeck)) {
      const DTOs: UserDeckDTO[] = [];
      for (const ud of userDeck) {
        const deck = await this.findOneIDeck(String(ud.deck));
        const deckDTO = await this.deckToDTO(deck);
        DTOs.push(new UserDeckDTO(ud, deckDTO));
      }
      return DTOs;
    } else {
      const deck = await this.findOneIDeck(String(userDeck.deck));
      const deckDTO = await this.deckToDTO(deck);
      return new UserDeckDTO(userDeck, deckDTO);
    }
  }
}

export function getMaxOrder<T extends { order: number }>(
  userDecks: T[]
): number {
  userDecks.sort((a, b) => b.order - a.order); // toSorted
  return userDecks[0]?.order || 0;
}

export const decksService = new DecksService();
