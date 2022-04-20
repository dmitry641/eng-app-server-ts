import { Document, model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  stripeCustomerId: string;
  active: boolean;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("User", UserSchema);
