import { Document, model, Schema } from "mongoose";

export interface UserPhoneSettingsInput {
  user: Schema.Types.ObjectId;
}

export interface IUserPhoneSettings extends UserPhoneSettingsInput, Document {
  phone?: string;
  phoneVerified?: boolean;
  phoneVerifAttempt: number;
  phoneWrongCodesCount: number;
}

const UserPhoneSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String },
    phoneVerified: { type: Boolean },
    phoneVerifAttempt: { type: Number, default: () => Date.now() },
    phoneWrongCodesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserPhoneSettingsModel = model<IUserPhoneSettings>(
  "UserPhoneSettings",
  UserPhoneSettingsSchema
);
