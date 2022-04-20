import { Document, model, Schema } from "mongoose";

export interface IUserPhoneSettings extends Document {
  user: Schema.Types.ObjectId;
  phone: string;
  phoneVerified: boolean;
  phoneVerifAttempt: number;
  phoneWrongCodesCount: number;
}

const UserPhoneSettingsSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
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
