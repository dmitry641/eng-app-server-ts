import { Document, model, Schema } from "mongoose";
import { TopicId } from "../quiz";

export interface QuestionInput {
  topic: TopicId;
  text: string;
}

export interface IQuestion extends QuestionInput, Document {}

const QuestionSchema: Schema = new Schema(
  {
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export const QuestionModel = model<IQuestion>("Question", QuestionSchema);
