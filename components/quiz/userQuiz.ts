import { randomIntFromInterval, shuffle } from "../../utils";
import { ObjId } from "../../utils/types";
import { User, UserId } from "../users/user";
import { IUserQuestion } from "./models/userQuestions.model";
import { IUserTopic, UserTopicStatusEnum } from "./models/userTopics.model";
import { globalQuizStore, Question, QuestionId, Topic, TopicId } from "./quiz";
import {
  oneDay,
  questionsInRowLIMIT,
  questionSliceEnd,
  UserQuestionService,
  UserTopicService,
} from "./quiz.service";

class UserQuizManager {
  private userQuizClients = new Map<UserId, UserQuizClient>();
  async getUserQuizClient(user: User): Promise<UserQuizClient> {
    // Нарушение принципов. Гет и сет в одном месте.
    let userQuizClient;
    userQuizClient = this.userQuizClients.get(user.id);
    if (userQuizClient) return userQuizClient;

    const userTopics = await this.getUserTopics(user);
    userQuizClient = new UserQuizClient(userTopics, user);

    this.userQuizClients.set(user.id, userQuizClient);
    return userQuizClient;
  }
  private async getUserTopics(user: User): Promise<UserTopic[]> {
    let userTopics: UserTopic[] = [];
    const dbUserTopics = await UserTopicService.findUserTopics({
      user: user.id,
    });

    for (let dbUserTopic of dbUserTopics) {
      const dbUserQuestions = await UserQuestionService.findUserQuestions({
        user: user.id,
      });
      const userQuestions: UserQuestion[] = dbUserQuestions.map(
        (q) => new UserQuestion(q)
      );
      const topic = globalQuizStore.getTopicById(dbUserTopic.topic);
      const userTopic = new UserTopic(dbUserTopic, topic, userQuestions);
      userTopics.push(userTopic);
    }

    return userTopics;
  }
}

class UserQuizClient {
  constructor(private userTopics: UserTopic[], private user: User) {}
  getUserTopicById(userTopicId: UserTopicId) {
    const userTopic = this.userTopics.find((d) => d.id === userTopicId);
    if (!userTopic) throw new Error("UserTopic doesn't exist");
    return userTopic;
  }
  // два запроса: init -> getQuestions
  async initUserTopic(): Promise<UserTopic> {
    let userTopic = await this.initCurrentUserTopic();
    if (!userTopic) {
      userTopic = await this.initRandomUserTopic();
    }
    return userTopic;
  }
  private async initCurrentUserTopic(): Promise<UserTopic | null> {
    const currentUserTopic = this.userTopics.find(
      (t) => t.status == UserTopicStatusEnum.current
    );
    if (currentUserTopic) return currentUserTopic;

    // FIX ME. отсортировать по updatedAt?
    const pausedUserTopic = this.userTopics.find(
      (t) => t.status == UserTopicStatusEnum.paused
    );
    if (pausedUserTopic) {
      const after24hr = new Date(pausedUserTopic.updatedAt).getTime() + oneDay;
      if (Date.now() > after24hr) return this.makeCurrent(pausedUserTopic);
    }

    const startedUserTopic = this.userTopics.find(
      (t) => t.status == UserTopicStatusEnum.started
    );
    if (startedUserTopic) return this.makeCurrent(startedUserTopic);

    return null;
  }
  private async initRandomUserTopic(): Promise<UserTopic> {
    const topics = this.getTopics();
    if (!topics.length) throw new Error("No topics found");
    const randomNumber = randomIntFromInterval(0, topics.length - 1);
    const randomTopic = topics[randomNumber];
    const userTopic = await this.addTopicToUserTopics(randomTopic);
    return this.makeCurrent(userTopic);
  }
  private getCurrentUserTopic(): UserTopic {
    const userTopic = this.userTopics.find(
      (t) => t.status === UserTopicStatusEnum.current
    );
    if (!userTopic) throw new Error("Current userTopic is not set");
    return userTopic;
  }
  async getQuestions(): Promise<Question[]> {
    const currentUserTopic = this.getCurrentUserTopic();
    const topic = globalQuizStore.getTopicById(currentUserTopic.topicId);
    const filtered = this.filterQuestions(currentUserTopic, topic);
    const shuffled = shuffle(filtered);
    const sliced = shuffled.slice(0, questionSliceEnd);
    return sliced;
  }
  async learnQuestion(
    questionId: QuestionId
  ): Promise<{ changeTopic: boolean }> {
    const currentUserTopic = this.getCurrentUserTopic();
    const topic = globalQuizStore.getTopicById(currentUserTopic.topicId);
    const question = topic.questions.find((q) => q.id == questionId);
    if (!question) throw new Error("Question not found");
    const learned = currentUserTopic.userQuestions.find(
      (q) => q.questionId == questionId
    );
    if (learned) throw new Error("Question is already learned");

    await currentUserTopic.setQuestionsInRow(
      currentUserTopic.questionsInRow + 1
    );

    const dbUserQuestion = await UserQuestionService.createUserQuestion({
      user: this.user.id,
      question: questionId,
    });
    const userQuestion = new UserQuestion(dbUserQuestion);
    currentUserTopic.appendToUserQuestions(userQuestion);

    let changeTopic = false;

    if (currentUserTopic.questionsInRow == questionsInRowLIMIT) {
      await currentUserTopic.setStatus(UserTopicStatusEnum.paused);
      await currentUserTopic.setQuestionsInRow(0);
      changeTopic = true;
    }
    if (
      currentUserTopic.userQuestions.length ==
      currentUserTopic.totalQuestionCount
    ) {
      await currentUserTopic.setStatus(UserTopicStatusEnum.finished);
      changeTopic = true;
    }

    return { changeTopic };
  }
  getTopics(): Topic[] {
    // filter shuffle slice
    const topics = globalQuizStore.getTopics();
    const userTopicsId = this.userTopics.map((t) => t.topicId);
    const filteredTopics = topics.filter((t) => !userTopicsId.includes(t.id));
    const shuffledTopics = shuffle(filteredTopics);
    const slicedTopics = shuffledTopics.slice(0, 5);
    return slicedTopics;
  }
  getUserTopics() {
    return this.userTopics;
  }
  async addTopicToUserTopics(topic: Topic): Promise<UserTopic> {
    const dbUserTopic = await UserTopicService.createUserTopic({
      topic: topic.id,
      user: this.user.id,
      status: UserTopicStatusEnum.started,
      totalQuestionCount: topic.questions.length,
    });
    const userTopic = new UserTopic(dbUserTopic, topic, []);
    this.userTopics.push(userTopic);
    return userTopic;
  }
  // три запроса: add -> change -> getQuestions
  async changeCurrentUserTopic(userTopicId: UserTopicId): Promise<UserTopic> {
    const userTopic = this.getUserTopicById(userTopicId);
    const currentUserTopic = this.userTopics.find(
      (t) => t.status === UserTopicStatusEnum.current
    );
    if (currentUserTopic) {
      if (userTopic.id === currentUserTopic.id) {
        throw new Error("UserTopic is current already");
      }
      await currentUserTopic.setQuestionsInRow(0);
      await currentUserTopic.setStatus(UserTopicStatusEnum.started);
    }
    if (userTopic.status === UserTopicStatusEnum.blocked) {
      throw new Error("UserTopic is blocked");
    }
    await userTopic.setStatus(UserTopicStatusEnum.current);
    return userTopic;
  }
  async blockUserTopic(userTopicId: UserTopicId): Promise<UserTopic> {
    const userTopic = this.getUserTopicById(userTopicId);
    if (userTopic.status === UserTopicStatusEnum.current) {
      throw new Error("Current userTopic cannot be blocked");
    }

    const newStatus =
      userTopic.status === UserTopicStatusEnum.blocked
        ? UserTopicStatusEnum.started
        : UserTopicStatusEnum.blocked;

    await userTopic.setStatus(newStatus);
    return userTopic;
  }
  private async makeCurrent(userTopic: UserTopic) {
    return userTopic.setStatus(UserTopicStatusEnum.current);
  }
  private filterQuestions(userTopic: UserTopic, topic: Topic): Question[] {
    const uqIds = userTopic.userQuestions.map((q) => q.questionId);
    const filtered = topic.questions.filter((q) => !uqIds.includes(q.id));
    return filtered;
  }
}

export type UserTopicId = ObjId;
export class UserTopic {
  readonly id: UserTopicId;
  private readonly _userTopic: IUserTopic;
  private _userQuestions: ReadonlyArray<UserQuestion>;
  readonly updatedAt: Date;
  readonly topicId: TopicId;
  readonly totalQuestionCount: number;
  readonly topicName: string;
  private _status: UserTopicStatusEnum;
  private _questionsInRow: number;
  constructor(
    userTopic: IUserTopic,
    topic: Topic,
    userQuestions: UserQuestion[]
  ) {
    this.id = userTopic._id;
    this._userTopic = userTopic;
    this._userQuestions = userQuestions;
    this.updatedAt = userTopic.updatedAt;
    this.topicId = userTopic.topic;
    this.totalQuestionCount = userTopic.totalQuestionCount;
    this.topicName = topic.topicName;
    this._status = userTopic.status;
    this._questionsInRow = userTopic.questionsInRow;
  }
  get userQuestions() {
    return this._userQuestions;
  }
  appendToUserQuestions(q: UserQuestion) {
    this._userQuestions = [...this._userQuestions, q];
  }
  get status() {
    return this._status;
  }
  async setStatus(status: UserTopicStatusEnum): Promise<UserTopic> {
    this._status = status;
    this._userTopic.status = status;
    this._userTopic.save();
    return this;
  }
  get questionsInRow() {
    return this._questionsInRow;
  }
  async setQuestionsInRow(value: number): Promise<UserTopic> {
    this._questionsInRow = value;
    this._userTopic.questionsInRow = value;
    this._userTopic.save();
    return this;
  }
}
export type UserQuestionId = ObjId;
export class UserQuestion {
  readonly id: UserQuestionId;
  private readonly _userQuestion: IUserQuestion;
  readonly questionId: QuestionId;
  constructor(userQuestion: IUserQuestion) {
    this.id = userQuestion._id;
    this._userQuestion = userQuestion;
    this.questionId = userQuestion.question;
  }
}

export const userQuizManager = new UserQuizManager();
