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
        topic: String(dbTopic._id),
      });
      const questions: Question[] = dbQuestions.map((q) => new Question(q));
      const topic: Topic = new Topic(dbTopic, questions);
      this.topics.push(topic);
    }
    this.initialized = true;
  }
  getTopics(): TopicDTO[] {
    return this.topics.map(this.topicToDTO);
  }
  getTopicById(topicId: TopicId): TopicDTO {
    const topic = this.getTopic(topicId);
    return this.topicToDTO(topic);
  }
  private getTopic(topicId: TopicId): Topic {
    const topic = this.topics.find((t) => t.id === topicId);
    if (!topic) throw new Error("Topic doesn't exist");
    return topic;
  }
  private topicToDTO(topic: Topic): TopicDTO {
    return new TopicDTO(topic);
  }
}

export type TopicId = string;
export class Topic {
  readonly id: TopicId;
  private readonly _topic: ITopic;
  readonly questions: ReadonlyArray<Question>;
  readonly topicName: string;
  readonly source: string;
  constructor(topic: ITopic, questions: Question[]) {
    this.id = String(topic._id);
    this._topic = topic;
    this.questions = questions;
    this.topicName = topic.topicName;
    this.source = topic.source;
  }
}
export class TopicDTO {
  readonly id: TopicId;
  readonly questions: ReadonlyArray<QuestionDTO>;
  readonly topicName: string;
  readonly source: string;
  constructor(topic: Topic) {
    this.id = topic.id;
    this.questions = topic.questions.map((q) => new QuestionDTO(q));
    this.topicName = topic.topicName;
    this.source = topic.source;
  }
}

export type QuestionId = string;
export class Question {
  readonly id: QuestionId;
  private readonly _question: IQuestion;
  readonly text: string;
  constructor(question: IQuestion) {
    this.id = String(question._id);
    this._question = question;
    this.text = question.text;
  }
}
export class QuestionDTO {
  readonly id: QuestionId;
  readonly text: string;
  constructor(question: Question) {
    this.id = question.id;
    this.text = question.text;
  }
}

export const globalQuizStore = new QuizStore();
