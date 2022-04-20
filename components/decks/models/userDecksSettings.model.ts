import { Document, model, Schema } from "mongoose";

// max order?
export interface IUserDeckSettings extends Document {
  user: Schema.Types.ObjectId;
  shuffleDecks: boolean;
  dynamicEmail: string;
  dynamicPassword: string;
  dynamicName: string;
  dynamicHighPriority: boolean;
  dynamicAccountName: string;
  // dynamicSyncType: { type: String, enum: DYNAMIC_TYPES_ARRAY },
  dynamicAutoSync: boolean;
  dynamicSyncMessage: string;
  dynamicSyncAttempts: number[];
}

const UserDeckSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    shuffleDecks: { type: Boolean, default: false },
    dynamicEmail: { type: String },
    dynamicPassword: { type: String },
    dynamicName: { type: String },
    dynamicHighPriority: { type: Boolean, default: true },
    dynamicAccountName: { type: String },
    // dynamicSyncType: { type: String, enum: DYNAMIC_TYPES_ARRAY },
    dynamicAutoSync: { type: Boolean, default: false },
    dynamicSyncMessage: { type: String },
    dynamicSyncAttempts: [Number],
  },
  { timestamps: true }
);

export const UserDeckSettingsModel = model<IUserDeckSettings>(
  "UserDeckSettings",
  UserDeckSettingsSchema
);
