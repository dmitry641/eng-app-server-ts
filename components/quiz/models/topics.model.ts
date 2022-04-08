import { model, Schema, Document } from "mongoose";

export interface ITopic extends Document {
  topicName: string;
  source: string;
}

const TopicSchema: Schema = new Schema(
  {
    topicName: { type: String, required: true },
    source: { type: String, required: true },
  },
  { timestamps: true }
);

export const TopicModel = model<ITopic>("Topic", TopicSchema);
