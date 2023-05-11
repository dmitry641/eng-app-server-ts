import { model, Schema } from "mongoose";
import { DocumentWithTimestamps } from "../../../utils/types";
import { IUser } from "../../users/models/users.model";
import { LearnedQuestion, UTStatus } from "../quiz.util";
import { ITopic } from "./topics.model";

export interface UserTopicInput {
  user: IUser["_id"];
  topic: ITopic["_id"];
  topicName: string; // populate?
  totalQuestionCount: number;
  status: UTStatus;
}

export interface IUserTopic extends UserTopicInput, DocumentWithTimestamps {
  questionsInRow: number;
  learnedQuestions: Array<LearnedQuestion>;
}

const learnedQuestionSchema = new Schema(
  {
    qId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    date: { type: Number, required: true },
  },
  { timestamps: true }
);

const UserTopicSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    topicName: { type: String, required: true }, // костыль
    status: {
      type: String,
      enum: UTStatus,
      required: true,
    },
    totalQuestionCount: { type: Number, required: true },
    questionsInRow: { type: Number, default: 0, required: true },
    learnedQuestions: [learnedQuestionSchema],
  },
  { timestamps: true }
);

export const UserTopicModel = model<IUserTopic>("UserTopic", UserTopicSchema);
