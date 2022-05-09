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

/*
interface QuizInit {
  userTopic: UserTopicDto;
  questions: QuestionDto[];
}

class QuizService {
  async init(userId: UserId): Promise<QuizInit> {
    let questions: IQuestion[];
    let userTopic = await getCurrentUserTopic(userId);
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
  async learnQuestion(
    userId: UserId,
    questionId: string
  ): Promise<{ changeTopic: boolean }> {
    const question = await QuestionService.findOneQuestion({ _id: questionId });
    if (!question) throw new Error("Question not found");

    const userTopic = await UserTopicService.findOneUserTopic({
      user: userId,
      status: UserTopicStatusEnum.current,
    });
    if (!userTopic) throw new Error("UserTopic not found");

    if (userTopic.topic !== question.topic) throw new Error("Wrong questionId");

    const learnedQuestions = userTopic.learnedQuestions;
    if (learnedQuestions.includes(question._id)) {
      throw new Error("Question is already learned");
    }

    learnedQuestions.push(question._id);
    userTopic.questionsInRow++;

    let changeTopic = false;

    if (userTopic.questionsInRow == questionsInRowLIMIT) {
      userTopic.status = UserTopicStatusEnum.paused;
      userTopic.questionsInRow = 0;
      changeTopic = true;
    }
    if (learnedQuestions.length == userTopic.totalQuestionCount) {
      userTopic.status = UserTopicStatusEnum.finished;
      changeTopic = true;
    }

    await userTopic.save();
    await UserQuestionService.createUserQuestion({
      user: userId,
      question: question._id,
    });

    return { changeTopic };
  }
  async getTopics(userId: UserId): Promise<{
    userTopics: UserTopicDto[];
    topics: TopicDto[];
  }> {
    // тот же баг, могут выпасть начатые топики
    const userTopics = await UserTopicService.findUserTopics({
      user: userId,
    });
    const topics = await TopicService.findTopics();
    const shuffledTopics = shuffle(topics);
    const slicedTopics = shuffledTopics.slice(0, 5);
    const userTopicsDto = userTopics.map((t) => new UserTopicDto(t));
    const topicsDto = slicedTopics.map((t) => new TopicDto(t));

    return { userTopics: userTopicsDto, topics: topicsDto };
  }
  async addTopicToUserTopics(
    userId: UserId,
    topicId: string
  ): Promise<UserTopicDto> {
    const topic = await TopicService.findOneTopic({ _id: topicId });
    if (!topic) throw new Error("Topic doesn't exist");

    const questions = await QuestionService.findQuestions({ topic: topic._id });

    const userTopic = await UserTopicService.createUserTopic({
      topic: topic._id,
      user: userId,
      status: UserTopicStatusEnum.started,
      totalQuestionCount: questions.length,
    });

    const userTopicDto = new UserTopicDto(userTopic);
    return userTopicDto;
  }
  // два запроса: add -> change
  async changeCurrentUserTopic(
    userId: UserId,
    userTopicId: string
  ): Promise<QuizInit> {
    const userTopic = await UserTopicService.findOneUserTopic({
      _id: userTopicId,
      user: userId,
    });
    if (!userTopic) throw new Error("UserTopic doesn't exist");

    const currentUserTopic = await UserTopicService.findOneUserTopic({
      user: userId,
      status: UserTopicStatusEnum.current,
    });
    if (currentUserTopic) {
      if (userTopic._id === currentUserTopic._id) {
        throw new Error("UserTopic is current already");
      }
      currentUserTopic.questionsInRow = 0;
      currentUserTopic.status = UserTopicStatusEnum.started;
      await currentUserTopic.save();
    }

    if (userTopic.status === UserTopicStatusEnum.blocked) {
      throw new Error("UserTopic is blocked");
    }

    userTopic.status = UserTopicStatusEnum.current;
    await userTopic.save();

    const questions = await QuestionService.findQuestions({
      topic: userTopic.topic,
    });

    const processedQuestions = getProcessedQuestions(questions, userTopic);
    const userTopicDto = new UserTopicDto(userTopic);
    const questionsDto = processedQuestions.map((q) => new QuestionDto(q));
    return { userTopic: userTopicDto, questions: questionsDto };
  }
  async blockUserTopic(
    userId: UserId,
    userTopicId: string
  ): Promise<UserTopicDto> {
    const userTopic = await UserTopicService.findOneUserTopic({
      _id: userTopicId,
      user: userId,
    });
    if (!userTopic) throw new Error("UserTopic doesn't exist");

    if (userTopic.status === UserTopicStatusEnum.current) {
      throw new Error("Current userTopic cannot be blocked");
    }
    userTopic.status =
      userTopic.status === UserTopicStatusEnum.blocked
        ? UserTopicStatusEnum.started
        : UserTopicStatusEnum.blocked;
    await userTopic.save();

    const userTopicDto = new UserTopicDto(userTopic);
    return userTopicDto;
  }
}
export const quizService = new QuizService();
*/
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

/*
async function getCurrentUserTopic(
  userId: UserId
): Promise<IUserTopic | undefined> {
  const userTopics: IUserTopic[] = await UserTopicService.findUserTopics({
    user: userId,
  });

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
  // баг: может выпасть уже пройденый/начатый/заблокированный топик
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

function getProcessedQuestions(
  questions: IQuestion[],
  userTopic: IUserTopic
): IQuestion[] {
  const filtered = questions.filter(
    (q) => !userTopic.learnedQuestions.includes(q._id)
  );
  const shuffled = shuffle<IQuestion>(filtered);
  const sliced = shuffled.slice(0, questionSliceEnd);
  return sliced;
}
*/
