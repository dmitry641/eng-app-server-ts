import { model, Schema, Document } from "mongoose";

export interface IUserQuestion extends Document {
  user: Schema.Types.ObjectId;
  question: Schema.Types.ObjectId;
}

const UserQuestionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "Topic" },
    question: { type: Schema.Types.ObjectId, ref: "Question" },
  },
  { timestamps: true }
);

export const UserQuestionModel = model<IUserQuestion>(
  "UserQuestion",
  UserQuestionSchema
);
