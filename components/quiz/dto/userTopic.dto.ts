import { IUserTopic, UserTopicStatusEnum } from "../models/userTopics.model";

// FIX ME, разобраться с populate, чтобы topicName тут тоже было
export class UserTopicDto {
  readonly id: string;
  readonly userId: string;
  readonly topicId: string;
  readonly totalQuestionCount: number;
  readonly status: UserTopicStatusEnum;
  readonly learnedQuestions: string[];
  readonly questionsInRow: number;
  constructor(userTopic: IUserTopic) {
    this.id = String(userTopic._id);
    this.userId = String(userTopic.user);
    this.topicId = String(userTopic.topic);
    this.totalQuestionCount = userTopic.totalQuestionCount;
    this.status = userTopic.status;
    this.learnedQuestions = userTopic.learnedQuestions.map((id) => String(id));
    this.questionsInRow = userTopic.questionsInRow;
  }
}
