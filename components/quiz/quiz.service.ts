import { ObjId, randomIntFromInterval, shuffle } from "../../utils";
import { FilterQuery, AnyKeys } from "mongoose";
import { QuestionDto } from "./dto/question.dto";
import { UserTopicDto } from "./dto/userTopic.dto";
import { IQuestion, QuestionModel } from "./models/questions.model";
import { ITopic, TopicModel } from "./models/topics.model";
import {
  IUserTopic,
  UserTopicModel,
  UserTopicStatusEnum,
} from "./models/userTopics.model";
import { IUserQuestion, UserQuestionModel } from "./models/userQuestions.model";

const questionsInRowLIMIT = 7;
const sliceEnd = 7;
const oneDay = 1000 * 60 * 60 * 24;

interface QuizInitDto {
  topic: UserTopicDto;
  questions: QuestionDto[];
}

// FIX ME. try catch?
class QuizService {
  async init(userId: ObjId): Promise<QuizInitDto> {
    const userTopics: IUserTopic[] = await UserTopicService.findUserTopics({
      user: userId,
    });
    let userTopic = getCurrentUserTopic(userTopics);
    let questions: IQuestion[];
    if (userTopic) {
      if (userTopic.status != UserTopicStatusEnum.current) {
        userTopic.status = UserTopicStatusEnum.current;
        await userTopic.save();
      }
      questions = await QuestionService.findQuestions({
        topic: userTopic.topic,
      });
    } else {
      const topics = await TopicService.findTopics();
      const randomNumber = randomIntFromInterval(1, topics.length - 1);
      const randomTopic = topics[randomNumber];
      questions = await QuestionService.findQuestions({
        topic: randomTopic._id,
      });
      userTopic = await UserTopicService.createUserTopic({
        user: userId,
        topic: randomTopic._id,
        status: UserTopicStatusEnum.current,
        totalQuestionCount: questions.length,
      });
    }

    const processedQuestions = getProcessedQuestions(questions, userTopic);
    const topicDto = new UserTopicDto(await userTopic.populate("topic"));
    const questionsDto = processedQuestions.map((q) => new QuestionDto(q));
    return { topic: topicDto, questions: questionsDto };
  }
}
export const quizService = new QuizService();

export class TopicService {
  static async createTopic(obj: AnyKeys<ITopic>): Promise<ITopic> {
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
  static async createQuestion(obj: AnyKeys<IQuestion>): Promise<IQuestion> {
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
  static async createUserTopic(obj: AnyKeys<IUserTopic>): Promise<IUserTopic> {
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
    obj: AnyKeys<IUserQuestion>
  ): Promise<IUserQuestion> {
    return UserQuestionModel.create(obj);
  }
  static async findUserQuestions(
    query: FilterQuery<IUserQuestion> = {}
  ): Promise<IUserQuestion[]> {
    return UserQuestionModel.find(query);
  }
}

function getCurrentUserTopic(userTopics: IUserTopic[]): IUserTopic | undefined {
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

    if (Date.now() > after24hr) return pausedTopic;
  }

  const startedTopic = userTopics.find(
    (topic) => topic.status == UserTopicStatusEnum.started
  );
  if (startedTopic) return startedTopic;

  return userTopic;
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
