import { Document, model, Schema } from "mongoose";
import { UserDeckId } from "../../decks/userDeck";
import { UserId } from "../../users/user";
import { CardId } from "../cards";

export interface UserCardInput {
  user: UserId;
  card: CardId;
  userDeck: UserDeckId;
}

export interface IUserCard extends UserCardInput, Document {
  history: { status: HistoryStatusEnum; date: number }[];
  deleted: boolean;
  favorite: boolean;
  showAfter: number;
}

export enum HistoryStatusEnum {
  easy = "easy",
  medium = "medium",
  hard = "hard",
}

const UserCardSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    userDeck: { type: Schema.Types.ObjectId, ref: "UserDeck", required: true },
    deleted: { type: Boolean, default: false, required: true },
    favorite: { type: Boolean, default: false, required: true },
    // может иначе сделать, а не showAfter
    showAfter: { type: Number, default: () => Date.now(), required: true },
    history: [
      {
        status: { type: String, enum: HistoryStatusEnum },
        date: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export const UserCardModel = model<IUserCard>("UserCard", UserCardSchema);
