import { FilterQuery } from "mongoose";
import {
  IQuestion,
  QuestionInput,
  QuestionModel,
} from "./models/questions.model";
import { ITopic, TopicInput, TopicModel } from "./models/topics.model";
import {
  IUserQuestion,
  UserQuestionInput,
  UserQuestionModel,
} from "./models/userQuestions.model";
import {
  IUserTopic,
  UserTopicInput,
  UserTopicModel,
} from "./models/userTopics.model";

export const questionsInRowLIMIT = 7;
export const questionSliceEnd = 7;
export const oneDay = 1000 * 60 * 60 * 24;

export class TopicService {
  static async createTopic(obj: TopicInput): Promise<ITopic> {
    return TopicModel.create(obj);
  }
  static async findTopics(query: FilterQuery<ITopic> = {}): Promise<ITopic[]> {
    return TopicModel.find(query);
  }
  static async findOneTopic(
    query: FilterQuery<ITopic>
  ): Promise<ITopic | null> {
    return TopicModel.findOne(query);
  }
  static async dropTopics() {
    return TopicModel.collection.drop();
  }
}
export class QuestionService {
  static async createQuestion(obj: QuestionInput): Promise<IQuestion> {
    return QuestionModel.create(obj);
  }
  static async findQuestions(
    query: FilterQuery<IQuestion> = {}
  ): Promise<IQuestion[]> {
    return QuestionModel.find(query);
  }
  static async findOneQuestion(
    query: FilterQuery<IQuestion>
  ): Promise<IQuestion | null> {
    return QuestionModel.findOne(query);
  }
  static async dropQuestions() {
    return QuestionModel.collection.drop();
  }
}
export class UserTopicService {
  static async findUserTopics(
    query: FilterQuery<IUserTopic> = {}
  ): Promise<IUserTopic[]> {
    return UserTopicModel.find(query);
  }
  static async findOneUserTopic(
    query: FilterQuery<IUserTopic>
  ): Promise<IUserTopic | null> {
    return UserTopicModel.findOne(query);
  }
  static async createUserTopic(obj: UserTopicInput): Promise<IUserTopic> {
    return UserTopicModel.create(obj);
  }
}
export class UserQuestionService {
  static async createUserQuestion(
    obj: UserQuestionInput
  ): Promise<IUserQuestion> {
    return UserQuestionModel.create(obj);
  }
  static async findUserQuestions(
    query: FilterQuery<IUserQuestion> = {}
  ): Promise<IUserQuestion[]> {
    return UserQuestionModel.find(query);
  }
}
