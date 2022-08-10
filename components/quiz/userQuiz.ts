import { randomIntFromInterval, shuffle } from "../../utils";
import { User, UserId } from "../users/user";
import { IUserQuestion } from "./models/userQuestions.model";
import { IUserTopic, UserTopicStatusEnum } from "./models/userTopics.model";
import {
  globalQuizStore,
  QuestionDTO,
  QuestionId,
  TopicDTO,
  TopicId,
} from "./quiz";
import {
  oneDay,
  questionsInRowLIMIT,
  questionSliceEnd,
  topicSliceEnd,
  UserQuestionService,
  UserTopicService,
} from "./quiz.service";

class UserQuizManager {
  private userQuizClients = new Map<UserId, UserQuizClient>();
  async getUserQuizClient(user: User): Promise<UserQuizClient> {
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
      const topic = globalQuizStore.getTopicById(String(dbUserTopic.topic));
      const userTopic = new UserTopic(dbUserTopic, topic, userQuestions);
      userTopics.push(userTopic);
    }

    return userTopics;
  }
}

export class UserQuizClient {
  constructor(private userTopics: UserTopic[], private user: User) {}
  private getUserTopic(userTopicId: UserTopicId): UserTopic {
    const userTopic = this.userTopics.find((d) => d.id === userTopicId);
    if (!userTopic) throw new Error("UserTopic doesn't exist");
    return userTopic;
  }
  private userTopicToDTO(userTopic: UserTopic): UserTopicDTO {
    return new UserTopicDTO(userTopic);
  }
  async initUserTopic(): Promise<UserTopicDTO> {
    let userTopic = await this.initCurrentUserTopic();
    if (!userTopic) {
      userTopic = await this.initRandomUserTopic();
    }
    return this.userTopicToDTO(userTopic);
  }
  private async initCurrentUserTopic(): Promise<UserTopic | null> {
    this.userTopics.sort(
      (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime()
    );

    const currentUserTopic = this.userTopics.find(
      (t) => t.status == UserTopicStatusEnum.current
    );
    if (currentUserTopic) return currentUserTopic;

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
    const userTopicDTO = await this.addTopicToUserTopics(randomTopic.id);
    const userTopic = this.getUserTopic(userTopicDTO.id);
    return this.makeCurrent(userTopic);
  }
  private getCurrentUserTopic(): UserTopic {
    const userTopic = this.userTopics.find(
      (ut) => ut.status === UserTopicStatusEnum.current
    );
    if (!userTopic) throw new Error("Current userTopic is not set");
    return userTopic;
  }
  getQuestions(): QuestionDTO[] {
    const currentUserTopic = this.getCurrentUserTopic();
    const topic = globalQuizStore.getTopicById(currentUserTopic.topicId);
    const questions = globalQuizStore.getQuestionsByTopicId(topic.id);
    const filtered = filterQuestions(currentUserTopic.userQuestions, questions);
    const shuffled = shuffle(filtered);
    const sliced = shuffled.slice(0, questionSliceEnd);
    return sliced;
  }
  async learnQuestion(
    questionId: QuestionId
  ): Promise<{ changeTopic: boolean }> {
    const currentUserTopic = this.getCurrentUserTopic();
    const topic = globalQuizStore.getTopicById(currentUserTopic.topicId);
    const questions = globalQuizStore.getQuestionsByTopicId(topic.id);
    const question = questions.find((q) => q.id == questionId);
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
  getTopics(): TopicDTO[] {
    const topics = globalQuizStore.getTopics();
    const filteredTopics = filterTopics(this.userTopics, topics);
    const shuffledTopics = shuffle(filteredTopics);
    const slicedTopics = shuffledTopics.slice(0, topicSliceEnd);
    return slicedTopics;
  }
  getUserTopics(): UserTopicDTO[] {
    return this.userTopics.map(this.userTopicToDTO);
  }
  async addTopicToUserTopics(topicId: TopicId): Promise<UserTopicDTO> {
    const topic = globalQuizStore.getTopicById(topicId);
    const questions = globalQuizStore.getQuestionsByTopicId(topic.id);

    const existedIds = this.userTopics.map((ut) => ut.topicId);
    const includes = existedIds.includes(topic.id);
    if (includes) throw new Error("Topic is already added");

    const dbUserTopic = await UserTopicService.createUserTopic({
      topic: topic.id,
      user: this.user.id,
      status: UserTopicStatusEnum.started,
      totalQuestionCount: questions.length,
    });
    const userTopic = new UserTopic(dbUserTopic, topic, []);
    this.userTopics.push(userTopic);
    return this.userTopicToDTO(userTopic);
  }
  async changeCurrentUserTopic(
    userTopicId: UserTopicId
  ): Promise<UserTopicDTO> {
    const userTopic = this.getUserTopic(userTopicId);
    if (userTopic.status === UserTopicStatusEnum.blocked) {
      throw new Error("UserTopic is blocked");
    }
    if (userTopic.status === UserTopicStatusEnum.finished) {
      throw new Error("UserTopic is finished");
    }

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

    await userTopic.setStatus(UserTopicStatusEnum.current);
    return this.userTopicToDTO(userTopic);
  }
  async blockUserTopic(userTopicId: UserTopicId): Promise<UserTopicDTO> {
    const userTopic = this.getUserTopic(userTopicId);
    if (userTopic.status === UserTopicStatusEnum.current) {
      throw new Error("Current userTopic cannot be blocked");
    }

    const newStatus =
      userTopic.status === UserTopicStatusEnum.blocked
        ? UserTopicStatusEnum.started
        : UserTopicStatusEnum.blocked;

    await userTopic.setStatus(newStatus);
    return this.userTopicToDTO(userTopic);
  }
  private async makeCurrent(userTopic: UserTopic) {
    return userTopic.setStatus(UserTopicStatusEnum.current);
  }
}

export function filterTopics(userTopics: UserTopic[], topics: TopicDTO[]) {
  const userTopicsId = userTopics.map((ut) => ut.topicId);
  const filteredTopics = topics.filter((t) => !userTopicsId.includes(t.id));
  return filteredTopics;
}

export function filterQuestions(
  userQuestions: readonly UserQuestionDTO[],
  questions: QuestionDTO[]
): QuestionDTO[] {
  const uqIds = userQuestions.map((uq) => uq.questionId);
  const filtered = questions.filter((q) => !uqIds.includes(q.id));
  return filtered;
}

export type UserTopicId = string;
export class UserTopic {
  readonly id: UserTopicId;
  private readonly _userTopic: IUserTopic;
  private _userQuestions: ReadonlyArray<UserQuestion>;
  private _updatedAt: Date;
  readonly topicId: TopicId;
  readonly totalQuestionCount: number;
  readonly topicName: string;
  private _status: UserTopicStatusEnum;
  private _questionsInRow: number;
  constructor(
    userTopic: IUserTopic,
    topic: TopicDTO,
    userQuestions: UserQuestion[]
  ) {
    this.id = String(userTopic._id);
    this._userTopic = userTopic;
    this._userQuestions = userQuestions;
    this._updatedAt = userTopic.updatedAt;
    this.topicId = String(userTopic.topic);
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
  get updatedAt() {
    return this._updatedAt;
  }
  get status() {
    return this._status;
  }
  async setStatus(status: UserTopicStatusEnum): Promise<UserTopic> {
    this._updatedAt = new Date();
    this._status = status;
    this._userTopic.status = status;
    await this._userTopic.save();
    return this;
  }
  get questionsInRow() {
    return this._questionsInRow;
  }
  async setQuestionsInRow(value: number): Promise<UserTopic> {
    this._questionsInRow = value;
    this._userTopic.questionsInRow = value;
    await this._userTopic.save();
    return this;
  }
}
export class UserTopicDTO {
  readonly id: UserTopicId;
  readonly updatedAt: Date;
  readonly topicId: TopicId;
  readonly totalQuestionCount: number;
  readonly userQuestions: string[];
  readonly topicName: string;
  readonly status: UserTopicStatusEnum;
  readonly questionsInRow: number;
  constructor(userTopic: UserTopic) {
    this.id = userTopic.id;
    this.updatedAt = userTopic.updatedAt;
    this.topicId = userTopic.topicId;
    this.totalQuestionCount = userTopic.totalQuestionCount;
    this.userQuestions = userTopic.userQuestions.map((q) => q.id);
    this.topicName = userTopic.topicName;
    this.status = userTopic.status;
    this.questionsInRow = userTopic.questionsInRow;
  }
}

export type UserQuestionId = string;
export class UserQuestion {
  readonly id: UserQuestionId;
  private readonly _userQuestion: IUserQuestion;
  readonly questionId: QuestionId;
  constructor(userQuestion: IUserQuestion) {
    this.id = String(userQuestion._id);
    this._userQuestion = userQuestion;
    this.questionId = String(userQuestion.question);
  }
}
export class UserQuestionDTO {
  readonly id: UserQuestionId;
  readonly questionId: QuestionId;
  constructor(userQuestion: UserQuestion) {
    this.id = userQuestion.id;
    this.questionId = userQuestion.questionId;
  }
}

export const userQuizManager = new UserQuizManager();
