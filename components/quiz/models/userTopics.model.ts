import { model, Schema } from "mongoose";
import { DocumentWithTimestamps } from "../../../utils/types";
import { UserId } from "../../users/user";
import { TopicId } from "../quiz";

export enum UserTopicStatusEnum {
  current = "current",
  paused = "paused",
  started = "started",
  finished = "finished",
  blocked = "blocked",
}

export interface UserTopicInput {
  user: UserId;
  topic: TopicId;
  totalQuestionCount: number;
  status: UserTopicStatusEnum;
}

export interface IUserTopic extends UserTopicInput, DocumentWithTimestamps {
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
    questionsInRow: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

export const UserTopicModel = model<IUserTopic>("UserTopic", UserTopicSchema);
