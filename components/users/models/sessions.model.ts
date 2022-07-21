import { Document, model, Schema } from "mongoose";
import { UserId } from "../user";

export interface ISession extends Document {
  user: UserId;
  valid: boolean;
  userAgent?: string;
  ip?: string;
}

const SessionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    valid: { type: Boolean, default: true },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

export const SessionModel = model<ISession>("Session", SessionSchema);
