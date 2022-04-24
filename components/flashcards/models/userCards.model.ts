import { Document, model, Schema } from "mongoose";

export interface UserCardInput {
  user: Schema.Types.ObjectId;
  card: Schema.Types.ObjectId;
}

export interface IUserCard extends UserCardInput, Document {
  history: { status: "enum"; date: number }[]; // FIX ME
  deleted: boolean;
  favorite: boolean;
  showAfter: number;
}

const UserCardSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    deleted: { type: Boolean, default: false, required: true },
    favorite: { type: Boolean, default: false, required: true },
    // может иначе сделать, а не showAfter
    showAfter: { type: Number, default: () => Date.now(), required: true },
    history: [
      {
        status: { type: String }, //  enum: ALLOWED_STATUSES
        date: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export const UserCardModel = model<IUserCard>("UserCard", UserCardSchema);
