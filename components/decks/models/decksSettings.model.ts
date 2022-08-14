import { Document, model, Schema } from "mongoose";
import { IUser } from "../../users/models/users.model";
import { DynamicSyncType } from "../decks.util";

export interface DecksSettingsInput {
  user: IUser["_id"];
}

export interface IDecksSettings extends DecksSettingsInput, Document {
  maxOrder: number;
  dynamicCreated: boolean;
  dynamicAutoSync: boolean;
  dynamicSyncType?: DynamicSyncType;
  dynamicSyncLink?: string;
  dynamicSyncMessage?: string;
  dynamicSyncAttempts: number[];
}

const DecksSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    maxOrder: { type: Number, default: 0, required: true },
    dynamicCreated: { type: Boolean, default: false, required: true },
    dynamicAutoSync: { type: Boolean, default: false, required: true },
    dynamicSyncType: { type: String, enum: DynamicSyncType },
    dynamicSyncLink: { type: String },
    dynamicSyncMessage: { type: String },
    dynamicSyncAttempts: [{ type: Number }],
  },
  { timestamps: true }
);

export const DecksSettingsModel = model<IDecksSettings>(
  "DecksSettings",
  DecksSettingsSchema
);
