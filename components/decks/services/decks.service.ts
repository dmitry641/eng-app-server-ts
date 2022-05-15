import { FilterQuery } from "mongoose";
import { DeckInput, DeckModel, IDeck } from "../models/decks.model";

export class DecksService {
  static async findDecks(query: FilterQuery<IDeck>): Promise<IDeck[]> {
    return DeckModel.find(query);
  }
  static async createDeck(obj: DeckInput): Promise<IDeck> {
    return DeckModel.create(obj);
  }
}
