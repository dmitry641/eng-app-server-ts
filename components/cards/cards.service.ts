import { FilterQuery } from "mongoose";
import { shuffle } from "../../utils";
import { decksService } from "../decks/decks.service";
import { DeckDTO, UserDeckDTO } from "../decks/decks.util";
import {
  CardDTO,
  CardsSettingsDTO,
  HistoryType,
  LrnDelType,
  LrnStatus,
  UpdateType,
  UserCardDTO,
  filterByCardId,
  intervalArray,
  slice,
} from "./cards.util";
import {
  CardInput,
  CardInputOmit,
  CardModel,
  ICard,
} from "./models/cards.model";
import {
  CardsSettingsModel,
  ICardsSettings,
} from "./models/cardsSettings.model";
import {
  IUserCard,
  UserCardInput,
  UserCardModel,
} from "./models/userCards.model";

export class CardsService {
  async getUserCards(userId: string): Promise<UserCardDTO[]> {
    let result: IUserCard[] = [];

    result = await this.getEmptyUserCards(userId);
    if (result.length !== 0) {
      return this.userCardToDTO(slice(result)); // pool/empty history
    }

    const settings = await this.findCardsSettings(userId);
    // if (settings.dynamicHighPriority) {
    //   result = await this.getUserCardsFromDynamicUserDeck(userId);
    //   if (result.length !== 0) return this.userCardToDTO(result); // dynamic deck
    // }

    if (settings.showLearned) {
      result = await this.getLearnedUserCards(userId);
      if (result.length !== 0) {
        return this.userCardToDTO(slice(result)); // learned cards
      }
    }

    result = await this.getUserCardsFromSortedUserDecks(userId); // order/shuffle deck
    return this.userCardToDTO(result);
  }
  async getFavorites(userId: string): Promise<UserCardDTO[]> {
    const userCards = await this.findIUserCards({
      user: userId,
      deleted: false,
    });
    const favorites = userCards.filter((uc) => uc.favorite);
    return this.userCardToDTO(favorites);
  }
  async getCardsSettings(userId: string): Promise<CardsSettingsDTO> {
    const settings = await this.findCardsSettings(userId);
    return this.settingsToDTO(settings);
  }
  async deleteUserCard(
    userId: string,
    userCardId: string
  ): Promise<LrnDelType> {
    const userCard = await this.findOneIUserCard(userId, userCardId);
    userCard.deleted = true;
    await userCard.save();

    const userDeck = await decksService.decrementCardsCount(
      userId,
      String(userCard.userDeck)
    );

    const ucDTO = await this.userCardToDTO(userCard);
    return { userCard: ucDTO, userDeck };
  }
  async favoriteUserCard(
    userId: string,
    userCardId: string
  ): Promise<UserCardDTO> {
    const userCard = await this.findOneIUserCard(userId, userCardId);
    userCard.favorite = !userCard.favorite;
    await userCard.save();
    return this.userCardToDTO(userCard);
  }
  async learnUserCard(
    userId: string,
    userCardId: string,
    status: LrnStatus
  ): Promise<LrnDelType> {
    const userCard = await this.findOneIUserCard(userId, userCardId);
    const prevHistoryLen = Number(userCard.history.length);
    if (Date.now() < userCard.showAfter) {
      throw new Error("This userCard cannot be learned now");
    }
    const newShowAfter = calcShowAfter(status, userCard.history);
    userCard.showAfter = newShowAfter;
    userCard.history.push({ status, date: Date.now() });
    await userCard.save();

    let userDeck: LrnDelType["userDeck"];
    if (prevHistoryLen === 0) {
      userDeck = await decksService.incrementCardsLearned(
        userId,
        String(userCard.userDeck)
      );
    }

    const ucDTO = await this.userCardToDTO(userCard);
    return { userCard: ucDTO, userDeck };
  }
  async updateSettings(
    userId: string,
    upd: UpdateType
  ): Promise<CardsSettingsDTO> {
    const settings = await this.findCardsSettings(userId);
    settings[upd.type] = upd.value;
    await settings.save();
    return this.settingsToDTO(settings);
  }

  private async getEmptyUserCards(userId: string): Promise<IUserCard[]> {
    const userCards = await this.findIUserCards({
      user: userId,
      deleted: false,
    });
    return userCards.filter((uc) => uc.history.length === 0);
  }

  private async getLearnedUserCards(userId: string): Promise<IUserCard[]> {
    const dateNow = Date.now();
    const userCards = await this.findIUserCards({
      user: userId,
      deleted: false,
    });
    const filtered = userCards.filter((uc) => dateNow > uc.showAfter);
    const sorted = filtered.sort((a, b) => a.showAfter - b.showAfter);
    return sorted;
  }
  private async getUserCardsFromSortedUserDecks(
    userId: string
  ): Promise<IUserCard[]> {
    let newUserCards: IUserCard[] = [];
    let userDecks = await decksService.getUserDecks(userId);
    userDecks = userDecks.filter((ud) => ud.enabled);

    const settings = await this.findCardsSettings(userId);
    if (settings.shuffleDecks) userDecks = shuffle(userDecks);

    for (const userDeck of userDecks) {
      newUserCards = await this.getUserCardsFromUserDeck(userId, userDeck);
      if (newUserCards.length !== 0) break;
    }
    return newUserCards;
  }
  private async getUserCardsFromUserDeck(
    userId: string,
    userDeck: UserDeckDTO
  ): Promise<IUserCard[]> {
    const newUserCards: IUserCard[] = [];
    const cards = await this.findICards(userDeck.deck.id);
    const userCards = await this.findIUserCards({ user: userId });
    const filteredCards = filterByCardId(cards, userCards);
    const shuffledCards = shuffle(filteredCards);
    const slicedCards = slice(shuffledCards);
    for (const card of slicedCards) {
      const userCardInput: UserCardInput = {
        card: String(card._id),
        user: userId,
        userDeck: userDeck.id,
      };
      const userCard = await UserCardModel.create(userCardInput);
      newUserCards.push(userCard);
    }
    return newUserCards;
  }
  private async findOneICard(cardId: string): Promise<ICard> {
    const card = await CardModel.findOne({ _id: cardId });
    if (!card) throw new Error("Card doesn't exist");
    return card;
  }
  private async findICards(deckId: string): Promise<ICard[]> {
    return CardModel.find({ deck: deckId });
  }
  private async findIUserCards(
    query: FilterQuery<IUserCard>
  ): Promise<IUserCard[]> {
    return UserCardModel.find(query);
  }
  private async findOneIUserCard(
    userId: string,
    userCardId: string
  ): Promise<IUserCard> {
    const userCard = await UserCardModel.findOne({
      user: userId,
      _id: userCardId,
      deleted: false,
    });
    if (!userCard) throw new Error("UserCard doesn't exist");
    return userCard;
  }
  private async findCardsSettings(userId: string): Promise<ICardsSettings> {
    const settings = await CardsSettingsModel.findOne({ user: userId });
    if (!settings) throw new Error("CardsSettings doesn't exist");
    return settings;
  }
  private cardToDTO(card: ICard) {
    return new CardDTO(card);
  }
  private async userCardToDTO(userCard: IUserCard): Promise<UserCardDTO>;
  private async userCardToDTO(userCard: IUserCard[]): Promise<UserCardDTO[]>;
  private async userCardToDTO(
    userCard: IUserCard | IUserCard[]
  ): Promise<UserCardDTO | UserCardDTO[]> {
    if (Array.isArray(userCard)) {
      const DTOs: UserCardDTO[] = [];
      for (const uc of userCard) {
        const card = await this.findOneICard(String(uc.card));
        const cardDTO = this.cardToDTO(card);
        DTOs.push(new UserCardDTO(uc, cardDTO));
      }
      return DTOs;
    } else {
      const card = await this.findOneICard(String(userCard.card));
      const cardDTO = this.cardToDTO(card);
      return new UserCardDTO(userCard, cardDTO);
    }
  }
  private settingsToDTO(settings: ICardsSettings): CardsSettingsDTO {
    return new CardsSettingsDTO(settings);
  }
  async createCards(
    rawCards: CardInputOmit[],
    deck: DeckDTO
  ): Promise<CardDTO[]> {
    const newCards: ICard[] = [];
    for (const rawCard of rawCards) {
      const reg3 = /((,.?)\s*$)|("|“|”|«|»|‘|’|„|‚|;)/g;
      rawCard.frontPrimary = rawCard.frontPrimary.replace(reg3, "");
      rawCard.backPrimary = rawCard.backPrimary.replace(reg3, "");

      const cardInput: CardInput = {
        deck: deck.id,
        ...rawCard,
      };
      const card = await CardModel.create(cardInput);
      newCards.push(card);
    }

    return newCards.map(this.cardToDTO);
  }
  async getCardsByDeckId(deckId: string): Promise<CardDTO[]> {
    const cards = await this.findICards(deckId);
    return cards.map(this.cardToDTO);
  }
}

export function calcShowAfter(
  status: LrnStatus,
  history: HistoryType[]
): number {
  let newShowAfter = Date.now();
  const intervalsArray = getIntervalArray(status);
  if (intervalsArray.length == 0) throw new Error("Array cannot be empty"); // FIXME ???

  let streak = getStreak(status, history);
  if (streak >= intervalsArray.length) {
    streak = intervalsArray.length - 1;
  }
  newShowAfter += intervalsArray[streak] || 0;
  return newShowAfter;
}
export function getIntervalArray(status: LrnStatus) {
  switch (status) {
    case LrnStatus.easy:
      return intervalArray.easyArray;
    case LrnStatus.medium:
      return intervalArray.mediumArray;
    case LrnStatus.hard:
      return intervalArray.hardArray;
    default:
      throw new Error("Invalid status");
  }
}
export function getStreak(status: LrnStatus, history: HistoryType[]) {
  let result = 0;
  let tempHistory = Array.from(history);
  tempHistory.reverse();
  for (let el of tempHistory) {
    if (el.status != status) break;
    result += 1;
  }
  return result;
}

export const cardsService = new CardsService();
