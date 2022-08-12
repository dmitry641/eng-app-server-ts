import { Document, model, Schema } from "mongoose";
import { ITopic } from "./topics.model";

export interface QuestionInput {
  topic: ITopic["_id"];
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
