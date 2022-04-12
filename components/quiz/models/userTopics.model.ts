import { model, Schema } from "mongoose";
import { DocumentWithTimestamps } from "../../../utils/types";

export enum UserTopicStatusEnum {
  notStarted = "not started",
  current = "current",
  paused = "paused",
  started = "started",
  finished = "finished",
  blocked = "blocked",
}

export interface IUserTopic extends DocumentWithTimestamps {
  user: Schema.Types.ObjectId;
  topic: Schema.Types.ObjectId;
  status: UserTopicStatusEnum;
  totalQuestionCount: number;
  learnedQuestions: Schema.Types.ObjectId[];
  questionsInRow: number;
}

const UserTopicSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    topic: { type: Schema.Types.ObjectId, ref: "Topic" },
    status: {
      type: String,
      enum: UserTopicStatusEnum,
      default: UserTopicStatusEnum.notStarted,
    },
    totalQuestionCount: { type: Number, required: true },
    learnedQuestions: [{ type: Schema.Types.ObjectId, ref: "Question" }], // FIX ME. Сработает?
    questionsInRow: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserTopicModel = model<IUserTopic>("UserTopic", UserTopicSchema);
