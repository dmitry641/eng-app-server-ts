import { Document, model, Schema } from "mongoose";

export interface TopicInput {
  topicName: string;
  source: string;
}

export interface ITopic extends TopicInput, Document {}

const TopicSchema: Schema = new Schema(
  {
    topicName: { type: String, required: true },
    source: { type: String, required: true },
  },
  { timestamps: true }
);

export const TopicModel = model<ITopic>("Topic", TopicSchema);
