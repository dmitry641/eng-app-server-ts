import { model, Schema } from "mongoose";
import { DocumentWithTimestamps } from "../../../utils/types";

export enum UserTopicStatusEnum {
  current = "current",
  paused = "paused",
  started = "started",
  finished = "finished",
  blocked = "blocked",
}

export interface UserTopicInput {
  user: Schema.Types.ObjectId;
  topic: Schema.Types.ObjectId;
  totalQuestionCount: number;
  status: UserTopicStatusEnum;
}

export interface IUserTopic extends UserTopicInput, DocumentWithTimestamps {
  learnedQuestions: Schema.Types.ObjectId[];
  questionsInRow: number;
}

const UserTopicSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    status: {
      type: String,
      enum: UserTopicStatusEnum,
      required: true,
    },
    totalQuestionCount: { type: Number, required: true },
    learnedQuestions: [{ type: Schema.Types.ObjectId, ref: "Question" }], // FIX ME. Сработает?
    questionsInRow: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

export const UserTopicModel = model<IUserTopic>("UserTopic", UserTopicSchema);
