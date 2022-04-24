import { FilterQuery } from "mongoose";
import { CardInput, CardModel, ICard } from "./models/cards.model";
import {
  IUserCard,
  UserCardInput,
  UserCardModel,
} from "./models/userCards.model";

export class UserCardsService {
  static async findUserCards(
    query: FilterQuery<IUserCard>
  ): Promise<IUserCard[]> {
    return UserCardModel.find(query);
  }
  static async createUserCard(obj: UserCardInput): Promise<IUserCard> {
    return UserCardModel.create(obj);
  }
}

export class CardsService {
  static async findCards(query: FilterQuery<ICard>): Promise<ICard[]> {
    return CardModel.find(query);
  }
  static async createCard(obj: CardInput): Promise<ICard> {
    return CardModel.create(obj);
  }
}
