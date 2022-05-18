import { Document, model, Schema } from "mongoose";
import { UserId } from "../../users/user";
import { QuestionId } from "../quiz";

export interface UserQuestionInput {
  user: UserId;
  question: QuestionId;
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
