import { IQuestion } from "./models/questions.model";
import { ITopic } from "./models/topics.model";
import { QuestionService, TopicService } from "./quiz.service";

class QuizStore {
  private initialized: boolean = false;
  private topics: Topic[] = [];
  private questions: Question[] = [];
  async init() {
    if (this.initialized) throw new Error("QuizStore is already initialized");
    const dbTopics = await TopicService.findTopics({});
    for (const dbTopic of dbTopics) {
      const topic: Topic = new Topic(dbTopic);
      this.topics.push(topic);
    }

    const dbQuestions = await QuestionService.findQuestions();
    for (const dbQuestion of dbQuestions) {
      const question: Question = new Question(dbQuestion);
      this.questions.push(question);
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
  getQuestionsByTopicId(topicId: TopicId): QuestionDTO[] {
    const questions = this.questions.filter((q) => q.topicId == topicId);
    return questions.map(this.questionToDTO);
  }
  private getTopic(topicId: TopicId): Topic {
    const topic = this.topics.find((t) => t.id === topicId);
    if (!topic) throw new Error("Topic doesn't exist");
    return topic;
  }
  private topicToDTO(topic: Topic): TopicDTO {
    return new TopicDTO(topic);
  }
  private questionToDTO(question: Question): QuestionDTO {
    return new QuestionDTO(question);
  }
}

export type TopicId = string;
export class Topic {
  readonly id: TopicId;
  private readonly _topic: ITopic;
  readonly topicName: string;
  readonly source: string;
  constructor(topic: ITopic) {
    this.id = String(topic._id);
    this._topic = topic;
    this.topicName = topic.topicName;
    this.source = topic.source;
  }
}
export class TopicDTO {
  readonly id: TopicId;
  readonly topicName: string;
  readonly source: string;
  constructor(topic: Topic) {
    this.id = topic.id;
    this.topicName = topic.topicName;
    this.source = topic.source;
  }
}

export type QuestionId = string;
export class Question {
  readonly id: QuestionId;
  private readonly _question: IQuestion;
  readonly text: string;
  readonly topicId: TopicId;
  constructor(question: IQuestion) {
    this.id = String(question._id);
    this._question = question;
    this.text = question.text;
    this.topicId = String(question.topic);
  }
}
export class QuestionDTO {
  readonly id: QuestionId;
  readonly text: string;
  readonly topicId: TopicId;
  constructor(question: Question) {
    this.id = question.id;
    this.text = question.text;
    this.topicId = question.topicId;
  }
}

export const globalQuizStore = new QuizStore();
