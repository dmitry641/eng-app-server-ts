import { IQuestion } from "./models/questions.model";
import { ITopic } from "./models/topics.model";
import { IUserTopic } from "./models/userTopics.model";

// quiz util

export const quizCsvHeaders = ["topicName", "text"] as const;
export type QuizKeysType = { [K in typeof quizCsvHeaders[number]]: string };
// или так
// type QuizKeysType = {
//   topicName: ITopic["topicName"];
//   text: IQuestion["text"];
// };
export type CreateCollType = {
  csvFileNames: string[];
  pathToDir: string;
  csvHeaders: (keyof QuizKeysType)[] | readonly (keyof QuizKeysType)[];
};

// misc + dto

export enum UTStatus {
  current = "current",
  paused = "paused",
  started = "started",
  finished = "finished",
  blocked = "blocked",
}
export const images_count = 10;
export const apiRoot = process.env.UNSPLASH_API_URL;
export const accessKey = process.env.UNSPLASH_ACCESS_KEY;
export const questionsInRowLIMIT = 7;
export const questionSliceEnd = 7;
export const oneDay = 1000 * 60 * 60 * 24;
export const topicSliceEnd = 5;

export type UTType = { userTopicId: string };
export type TType = { topicId: string };
export type QType = { questionId: string };

export type UnsplashImage = {
  id: string;
  width: number;
  height: number;
  description: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    links: {
      html: string;
    };
  };
};
export type UnsplashResponse = {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
};
export class ImageDto {
  readonly id: string;
  readonly original: string;
  readonly thumbnail: string;
  readonly name: string;
  readonly userLink: string;
  readonly description: string;
  constructor(img: UnsplashImage) {
    this.id = img.id;
    this.original = img.urls.regular;
    this.thumbnail = img.urls.thumb;
    this.name = img.user.name;
    this.userLink = img.user.links.html;
    this.description = img.description;
  }
}

export class TopicDTO {
  readonly id: string;
  readonly topicName: string;
  readonly source: string;
  constructor(topic: ITopic) {
    this.id = String(topic._id);
    this.topicName = topic.topicName;
    this.source = topic.source;
  }
}

export class QuestionDTO {
  readonly id: string;
  readonly text: string;
  readonly topicId: string;
  constructor(question: IQuestion) {
    this.id = String(question._id);
    this.text = question.text;
    this.topicId = String(question.topic);
  }
}

export class UserTopicDTO {
  readonly id: string;
  readonly updatedAt: Date;
  readonly topicId: string;
  readonly totalQuestionCount: number;
  readonly learnedQuestions: string[];
  readonly topicName: string;
  readonly status: UTStatus;
  readonly questionsInRow: number;
  constructor(userTopic: IUserTopic) {
    this.id = String(userTopic._id);
    this.updatedAt = userTopic.updatedAt;
    this.topicId = String(userTopic.topic);
    this.totalQuestionCount = userTopic.totalQuestionCount;
    this.learnedQuestions = userTopic.learnedQuestions.map(String);
    this.topicName = userTopic.topicName;
    this.status = userTopic.status;
    this.questionsInRow = userTopic.questionsInRow;
  }
}

// functions

export function filterTopics(userTopics: IUserTopic[], topics: ITopic[]) {
  const utIds = userTopics.map((ut) => String(ut.topic));
  const filteredTopics = topics.filter((t) => !utIds.includes(String(t._id)));
  return filteredTopics;
}

export function filterQuestions(
  learnedQuestions: IUserTopic["learnedQuestions"], // почему any[]? и почему нет ошибок?
  questions: IQuestion[]
): IQuestion[] {
  const lrnQstIds = learnedQuestions.map((lq) => String(lq));
  const filtered = questions.filter((q) => !lrnQstIds.includes(String(q._id)));
  return filtered;
}
