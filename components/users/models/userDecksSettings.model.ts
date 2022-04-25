import { Document, model, Schema } from "mongoose";
import { UserId } from "../user";

export interface UserDecksSettingsInput {
  user: UserId;
}

export interface IUserDecksSettings extends UserDecksSettingsInput, Document {
  shuffleDecks: boolean;
  maxOrder: number;
  dynamicHighPriority: boolean;
  dynamicEmail?: string;
  dynamicPassword?: string;
  dynamicName?: string;
  dynamicAccountName?: string;
  dynamicAutoSync?: boolean;
  // dynamicSyncType: { type: String, enum: DYNAMIC_TYPES_ARRAY },
  dynamicSyncMessage?: string;
  dynamicSyncAttempts?: number[];
}

const UserDecksSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shuffleDecks: { type: Boolean, default: false },
    maxOrder: { type: Number, default: 0, required: true },
    dynamicHighPriority: { type: Boolean, default: true },
    dynamicEmail: { type: String },
    dynamicPassword: { type: String },
    dynamicName: { type: String },
    dynamicAccountName: { type: String },
    dynamicAutoSync: { type: Boolean, default: false },
    // dynamicSyncType: { type: String, enum: DYNAMIC_TYPES_ARRAY },
    dynamicSyncMessage: { type: String },
    dynamicSyncAttempts: [Number],
  },
  { timestamps: true }
);

export const UserDecksSettingsModel = model<IUserDecksSettings>(
  "UserDecksSettings",
  UserDecksSettingsSchema
);
