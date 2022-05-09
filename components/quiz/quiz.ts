import { ObjId } from "../../utils/types";
import { IQuestion } from "./models/questions.model";
import { ITopic } from "./models/topics.model";
import { QuestionService, TopicService } from "./quiz.service";

class QuizStore {
  private initialized: boolean = false;
  private topics: Topic[] = [];
  async init() {
    if (this.initialized) throw new Error("QuizStore is already initialized");
    const dbTopics = await TopicService.findTopics({});
    for (const dbTopic of dbTopics) {
      const dbQuestions = await QuestionService.findQuestions({
        topic: dbTopic._id,
      });
      const questions: Question[] = dbQuestions.map((q) => new Question(q));
      const topic: Topic = new Topic(dbTopic, questions);
      this.topics.push(topic);
    }
    this.initialized = true;
  }
  getTopics(): Topic[] {
    return this.topics;
  }
  getTopicById(topicId: TopicId) {
    const topic = this.topics.find((d) => d.id === topicId);
    if (!topic) throw new Error("Topic doesn't exist");
    return topic;
  }
}

export type TopicId = ObjId;
export class Topic {
  readonly id: TopicId;
  private readonly _topic: ITopic;
  readonly questions: ReadonlyArray<Question>;
  readonly topicName: string;
  readonly source: string;
  constructor(topic: ITopic, questions: Question[]) {
    this.id = topic._id;
    this._topic = topic;
    this.questions = questions;
    this.topicName = topic.topicName;
    this.source = topic.source;
  }
}

export type QuestionId = ObjId;
export class Question {
  readonly id: QuestionId;
  private readonly _question: IQuestion;
  readonly text: string;
  constructor(question: IQuestion) {
    this.id = question._id;
    this._question = question;
    this.text = question.text;
  }
}

export const globalQuizStore = new QuizStore();
