import { Document, model, Schema } from "mongoose";
import { UserId } from "../user";
import { DynamicSyncDataType, DynamicSyncTypeEnum } from "../user.util";

export interface UserDecksSettingsInput {
  user: UserId;
}

export interface IUserDecksSettings extends UserDecksSettingsInput, Document {
  shuffleDecks: boolean;
  maxOrder: number;
  dynamicHighPriority: boolean;
  dynamicAutoSync: boolean;
  dynamicSyncType?: DynamicSyncTypeEnum;
  dynamicSyncData?: DynamicSyncDataType;
  dynamicSyncMessage?: string;
}

const UserDecksSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shuffleDecks: { type: Boolean, default: false },
    maxOrder: { type: Number, default: 0, required: true },
    dynamicHighPriority: { type: Boolean, default: true, required: true },
    dynamicAutoSync: { type: Boolean, default: false, required: true },
    dynamicSyncType: { type: String, enum: DynamicSyncTypeEnum },
    dynamicSyncData: {
      email: { type: String },
      password: { type: String },
      accountName: { type: String },
    },
    dynamicSyncMessage: { type: String },
  },
  { timestamps: true }
);

export const UserDecksSettingsModel = model<IUserDecksSettings>(
  "UserDecksSettings",
  UserDecksSettingsSchema
);
