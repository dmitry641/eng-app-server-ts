import { model, Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  topic: Schema.Types.ObjectId;
  question: string;
}

const QuestionSchema: Schema = new Schema(
  {
    topic: { type: Schema.Types.ObjectId, ref: "Topic" },
    question: { type: String, required: true },
  },
  { timestamps: true }
);

export const QuestionModel = model<IQuestion>("Question", QuestionSchema);
