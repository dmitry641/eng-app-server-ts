import { Document, model, Schema } from "mongoose";

export interface UserQuestionInput {
  user: Schema.Types.ObjectId;
  question: Schema.Types.ObjectId;
}

export interface IUserQuestion extends UserQuestionInput, Document {}

const UserQuestionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
  },
  { timestamps: true }
);

export const UserQuestionModel = model<IUserQuestion>(
  "UserQuestion",
  UserQuestionSchema
);
