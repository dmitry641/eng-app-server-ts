import { AnyKeys, FilterQuery } from "mongoose";
import { randomIntFromInterval, shuffle } from "../../utils";
import { UserId } from "../users/user";
import { QuestionDto } from "./dto/question.dto";
import { TopicDto } from "./dto/topic.dto";
import { UserTopicDto } from "./dto/userTopic.dto";
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
  UserTopicStatusEnum,
} from "./models/userTopics.model";

const questionsInRowLIMIT = 7;
const sliceEnd = 7;
const oneDay = 1000 * 60 * 60 * 24;

// FIX ME
// init переименовать? и updateQuestion?
class QuizService {
  async init(userId: UserId): Promise<{
    userTopic: UserTopicDto;
    questions: QuestionDto[];
  }> {
    const userTopics: IUserTopic[] = await UserTopicService.findUserTopics({
      user: userId,
    });
    let userTopic = await getCurrentUserTopic(userTopics);
    let questions: IQuestion[];
    if (userTopic) {
      questions = await QuestionService.findQuestions({
        topic: userTopic.topic,
      });
    } else {
      const result = await getRandomUserTopicAndQuestions(userId);
      userTopic = result.userTopic;
      questions = result.questions;
    }

    const processedQuestions = getProcessedQuestions(questions, userTopic);
    const userTopicsDto = new UserTopicDto(await userTopic.populate("topic"));
    const questionsDto = processedQuestions.map((q) => new QuestionDto(q));
    return { userTopic: userTopicsDto, questions: questionsDto };
  }
  async updateQuestion() {}
  async getTopics(userId: UserId): Promise<{
    userTopics: UserTopicDto[];
    topics: TopicDto[];
  }> {
    const userTopics = await UserTopicService.findUserTopics({
      user: userId,
    });
    const topics = await TopicService.findTopics();
    const shuffledTopics = shuffle(topics);
    const slicedTopics = shuffledTopics.slice(0, 5);
    // FIX ME, возможно populate будет нужен. + topicId: t._id....
    const userTopicsDto = userTopics.map((t) => new UserTopicDto(t));
    const topicsDto = slicedTopics.map((t) => new TopicDto(t));

    return { userTopics: userTopicsDto, topics: topicsDto };
  }
  async changeTopic() {}
  async blockTopic() {}
}
export const quizService = new QuizService();

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
  static async updateUserTopic(
    query: FilterQuery<IUserTopic>,
    update: AnyKeys<IUserTopic>
  ) {
    return UserTopicModel.updateOne(query, update);
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

async function getCurrentUserTopic(
  userTopics: IUserTopic[]
): Promise<IUserTopic | undefined> {
  let userTopic;
  const currentTopic = userTopics.find(
    (topic) => topic.status == UserTopicStatusEnum.current
  );
  if (currentTopic) return currentTopic;

  // FIX ME. отсортировать по updatedAt?
  const pausedTopic = userTopics.find(
    (topic) => topic.status == UserTopicStatusEnum.paused
  );
  if (pausedTopic) {
    const after24hr = new Date(pausedTopic.updatedAt).getTime() + oneDay;
    if (Date.now() > after24hr) return makeCurrent(pausedTopic);
  }

  const startedTopic = userTopics.find(
    (topic) => topic.status == UserTopicStatusEnum.started
  );
  if (startedTopic) return makeCurrent(startedTopic);

  return userTopic;
}

async function getRandomUserTopicAndQuestions(
  userId: UserId
): Promise<{ userTopic: IUserTopic; questions: IQuestion[] }> {
  const topics = await TopicService.findTopics();
  const randomNumber = randomIntFromInterval(1, topics.length - 1);
  const randomTopic = topics[randomNumber];
  const questions = await QuestionService.findQuestions({
    topic: randomTopic._id,
  });
  const userTopic = await UserTopicService.createUserTopic({
    user: userId,
    topic: randomTopic._id,
    status: UserTopicStatusEnum.current,
    totalQuestionCount: questions.length,
  });
  return { userTopic, questions };
}

async function makeCurrent(userTopic: IUserTopic): Promise<IUserTopic> {
  userTopic.status = UserTopicStatusEnum.current;
  return userTopic.save();
}

// FIX ME, протестировать, возмножно тут Populate нужен
function getProcessedQuestions(
  questions: IQuestion[],
  userTopic: IUserTopic
): IQuestion[] {
  const filtered = questions.filter(
    (q) => !userTopic.learnedQuestions.includes(q._id)
  );
  const shuffled = shuffle<IQuestion>(filtered);
  const sliced = shuffled.slice(0, sliceEnd);
  return sliced;
}
