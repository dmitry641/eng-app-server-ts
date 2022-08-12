import { Document, model, Schema } from "mongoose";
import { IUser } from "./users.model";

export interface SessionInput {
  user: IUser["_id"];
}

export interface ISession extends SessionInput, Document {
  valid: boolean;
  userAgent: string;
  ip: string;
}

const SessionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    valid: { type: Boolean, required: true, default: true },
    userAgent: { type: String, required: true, default: "" },
    ip: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

export const SessionModel = model<ISession>("Session", SessionSchema);
