import { model, Schema } from "mongoose";
import { DocumentWithTimestamps } from "../../../utils/types";
import { IUser } from "../../users/models/users.model";
import { UTStatus } from "../quiz.util";
import { IQuestion } from "./questions.model";
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
  learnedQuestions: Array<IQuestion["_id"]>;
}

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
    learnedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

export const UserTopicModel = model<IUserTopic>("UserTopic", UserTopicSchema);
