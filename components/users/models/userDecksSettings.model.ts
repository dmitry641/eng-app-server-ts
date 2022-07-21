import { Document, model, Schema } from "mongoose";
import { UserId } from "../user";
import { DynamicSyncType } from "../users.util";

export interface UserDecksSettingsInput {
  user: UserId;
}

export interface IUserDecksSettings extends UserDecksSettingsInput, Document {
  maxOrder: number;
  dynamicAutoSync: boolean;
  dynamicSyncType?: DynamicSyncType;
  dynamicSyncLink?: string;
  dynamicSyncMessage?: string;
}

const UserDecksSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    maxOrder: { type: Number, default: 0, required: true },
    dynamicAutoSync: { type: Boolean, default: false, required: true },
    dynamicSyncType: { type: String, enum: DynamicSyncType },
    dynamicSyncLink: { type: String },
    dynamicSyncMessage: { type: String },
  },
  { timestamps: true }
);

export const UserDecksSettingsModel = model<IUserDecksSettings>(
  "UserDecksSettings",
  UserDecksSettingsSchema
);
