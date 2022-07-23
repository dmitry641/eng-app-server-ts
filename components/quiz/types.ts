import { QuestionId, TopicId } from "./quiz";
import { UserTopicId } from "./userQuiz";

export type UTType = { userTopicId: UserTopicId };
export type TType = { topicId: TopicId };
export type QType = { questionId: QuestionId };
