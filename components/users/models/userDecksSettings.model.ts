import { Document, model, Schema } from "mongoose";

export interface UserDecksSettingsInput {
  user: Schema.Types.ObjectId;
}

// max order?
export interface IUserDecksSettings extends UserDecksSettingsInput, Document {
  shuffleDecks: boolean;
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
