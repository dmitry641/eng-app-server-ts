import path from "path";
import {
  getBuffer,
  getCsvData,
  randomIntFromInterval,
  shuffle,
} from "../../utils";
import {
  IQuestion,
  QuestionInput,
  QuestionModel,
} from "./models/questions.model";
import { ITopic, TopicInput, TopicModel } from "./models/topics.model";
import {
  IUserTopic,
  UserTopicInput,
  UserTopicModel,
} from "./models/userTopics.model";
import {
  CreateCollType,
  filterQuestions,
  filterTopics,
  oneDay,
  QuestionDTO,
  questionsInRowLIMIT,
  questionSliceEnd,
  quizCsvHeaders,
  QuizKeysType,
  TopicDTO,
  topicSliceEnd,
  UserTopicDTO,
  UTStatus,
} from "./quiz.util";

export class QuizService {
  async initUserTopic(userId: string): Promise<UserTopicDTO> {
    let currentUT = await this.initCurrentUserTopic(userId);
    if (!currentUT) {
      currentUT = await this.initRandomUserTopic(userId);
    }
    return this.userTopicToDTO(currentUT);
  }
  async getTopics(userId: string): Promise<TopicDTO[]> {
    const topics = await TopicModel.find({});
    const userTopics = await this.findIUserTopics(userId);
    const filteredTopics = filterTopics(userTopics, topics);
    const shuffledTopics = shuffle(filteredTopics);
    const slicedTopics = shuffledTopics.slice(0, topicSliceEnd);
    return slicedTopics.map(this.topicToDTO);
  }
  async addTopicToUserTopics(
    userId: string,
    topicId: string
  ): Promise<UserTopicDTO> {
    const topic = await this.findOneITopic(topicId);
    const userTopics = await this.findIUserTopics(userId);
    const existedIds = userTopics.map((ut) => String(ut.topic));
    const includes = existedIds.includes(String(topic._id));
    if (includes) throw new Error("Topic is already added");

    const questions = await this.findIQuestions(String(topic._id));
    const userTopicInput: UserTopicInput = {
      topic: String(topic._id),
      topicName: topic.topicName, // костыль
      user: userId,
      status: UTStatus.started,
      totalQuestionCount: questions.length,
    };
    const userTopic = await UserTopicModel.create(userTopicInput);
    return this.userTopicToDTO(userTopic);
  }
  async getUserTopics(userId: string): Promise<UserTopicDTO[]> {
    const userTopics = await this.findIUserTopics(userId);
    userTopics.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
    return userTopics.map(this.userTopicToDTO);
  }
  async selectUserTopic(
    userId: string,
    userTopicId: string
  ): Promise<UserTopicDTO> {
    const userTopic = await this.findOneIUserTopic(userId, userTopicId);
    if (userTopic.status === UTStatus.blocked) {
      throw new Error("UserTopic is blocked");
    }
    if (userTopic.status === UTStatus.finished) {
      throw new Error("UserTopic is finished");
    }

    const userTopics = await this.findIUserTopics(userId);
    const currentUT = userTopics.find((ut) => ut.status === UTStatus.current);
    if (currentUT) {
      if (String(userTopic._id) === String(currentUT._id)) {
        throw new Error("UserTopic is current already");
      }
      currentUT.questionsInRow = 0;
      currentUT.status = UTStatus.started;
      await currentUT.save();
    }

    userTopic.status = UTStatus.current;
    await userTopic.save();

    return this.userTopicToDTO(userTopic);
  }
  async blockUserTopic(
    userId: string,
    userTopicId: string
  ): Promise<UserTopicDTO> {
    const userTopic = await this.findOneIUserTopic(userId, userTopicId);
    if (userTopic.status === UTStatus.current) {
      throw new Error("Current userTopic cannot be blocked");
    }
    if (userTopic.status === UTStatus.finished) {
      throw new Error("Finished userTopic cannot be blocked");
    }

    const newStatus =
      userTopic.status === UTStatus.blocked
        ? UTStatus.started
        : UTStatus.blocked;

    userTopic.status = newStatus;
    await userTopic.save();

    return this.userTopicToDTO(userTopic);
  }
  async getQuestions(userId: string): Promise<QuestionDTO[]> {
    const currentUT = await this.getCurrentUT(userId);
    const topic = await this.findOneITopic(String(currentUT.topic));
    const questions = await this.findIQuestions(String(topic._id));
    const filtered = filterQuestions(currentUT.learnedQuestions, questions);
    const shuffled = shuffle(filtered);
    const sliced = shuffled.slice(0, questionSliceEnd);
    return sliced.map(this.questionToDTO);
  }
  async learnQuestion(
    userId: string,
    questionId: string
  ): Promise<{ changeTopic: boolean }> {
    const currentUT = await this.getCurrentUT(userId);
    const topic = await this.findOneITopic(String(currentUT.topic));
    const questions = await this.findIQuestions(String(topic._id));
    const question = questions.find((q) => String(q._id) === questionId);
    if (!question) throw new Error("Question not found");
    const learned = currentUT.learnedQuestions.find(
      (lq) => String(lq.qId) === questionId
    );
    if (learned) throw new Error("Question is already learned");

    currentUT.questionsInRow = currentUT.questionsInRow + 1;
    currentUT.learnedQuestions.push({ qId: questionId, date: Date.now() });

    let changeTopic = false;
    if (currentUT.questionsInRow === questionsInRowLIMIT) {
      currentUT.status = UTStatus.paused;
      currentUT.questionsInRow = 0;
      changeTopic = true;
    }
    if (currentUT.learnedQuestions.length === currentUT.totalQuestionCount) {
      currentUT.status = UTStatus.finished;
      changeTopic = true;
    }

    await currentUT.save();

    return { changeTopic };
  }
  private async findOneIUserTopic(
    userId: string,
    userTopicId: string
  ): Promise<IUserTopic> {
    const userTopic = await UserTopicModel.findOne({
      user: userId,
      _id: userTopicId,
    });
    if (!userTopic) throw new Error("UserTopic doesn't exist");
    return userTopic;
  }
  private async findOneITopic(topicId: string): Promise<ITopic> {
    const topic = await TopicModel.findOne({ _id: topicId });
    if (!topic) throw new Error("Topic doesn't exist");
    return topic;
  }
  private async findIUserTopics(userId: string): Promise<IUserTopic[]> {
    return UserTopicModel.find({ user: userId });
  }
  private async findIQuestions(topicId: string): Promise<IQuestion[]> {
    return QuestionModel.find({ topic: topicId });
  }
  private async getCurrentUT(userId: string): Promise<IUserTopic> {
    const userTopics = await this.findIUserTopics(userId);
    const currentUT = userTopics.find((ut) => ut.status === UTStatus.current);
    if (!currentUT) throw new Error("Current userTopic is not set");
    return currentUT;
  }
  private async initCurrentUserTopic(
    userId: string
  ): Promise<IUserTopic | null> {
    let userTopics = await this.findIUserTopics(userId);
    userTopics.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

    const currentUT = userTopics.find((ut) => ut.status === UTStatus.current);
    if (currentUT) return currentUT;

    const pausedUT = userTopics.find((ut) => ut.status === UTStatus.paused);
    if (pausedUT) {
      const after24hr = new Date(pausedUT.updatedAt).getTime() + oneDay;
      if (Date.now() > after24hr) return this.makeCurrent(pausedUT);
    }

    const startedUT = userTopics.find((ut) => ut.status === UTStatus.started);
    if (startedUT) return this.makeCurrent(startedUT);

    return null;
  }
  private async initRandomUserTopic(userId: string): Promise<IUserTopic> {
    const topics = await this.getTopics(userId);
    if (!topics.length) throw new Error("No topics found");
    const randomNumber = randomIntFromInterval(0, topics.length - 1);
    const randomTopic = topics[randomNumber];
    const utDTO = await this.addTopicToUserTopics(userId, randomTopic.id);
    const userTopic = await this.findOneIUserTopic(userId, utDTO.id);
    return this.makeCurrent(userTopic);
  }
  private userTopicToDTO(userTopic: IUserTopic): UserTopicDTO {
    return new UserTopicDTO(userTopic);
  }
  private topicToDTO(topic: ITopic): TopicDTO {
    return new TopicDTO(topic);
  }
  private questionToDTO(question: IQuestion): QuestionDTO {
    return new QuestionDTO(question);
  }
  private async makeCurrent(userTopic: IUserTopic): Promise<IUserTopic> {
    userTopic.status = UTStatus.current;
    return userTopic.save();
  }
}

export const quizService = new QuizService();

export class QuizDB {
  static async saturate() {
    const topics = await TopicModel.find();
    const questions = await QuestionModel.find();
    if (topics.length && questions.length) return;
    if (topics.length) await TopicModel.collection.drop();
    if (questions.length) await QuestionModel.collection.drop();
    console.log("Quiz: Topics and questions collections are creating...");
    await this.createCollections({
      csvFileNames: ["esldiscussions", "iteslj"],
      pathToDir: path.resolve(__dirname, "quizdata"),
      csvHeaders: quizCsvHeaders,
    });
    console.log("Quiz: Topics and questions collections created.");
  }

  static async createCollections({
    csvFileNames,
    pathToDir,
    csvHeaders,
  }: CreateCollType) {
    let parsedData: {
      source: string;
      data: QuizKeysType[];
    }[] = [];

    for (let fileName of csvFileNames) {
      const pathToFile = path.resolve(pathToDir, fileName + ".csv");
      const buffer = getBuffer(pathToFile);
      const data = await getCsvData<QuizKeysType>(
        buffer,
        csvHeaders,
        [true, true],
        "|"
      );
      parsedData.push({ source: fileName, data });
    }

    for (let { source, data } of parsedData) {
      await this.createNewQuestion(source, data);
    }
  }

  static async createNewQuestion(source: string, data: QuizKeysType[]) {
    let uniqueTopics = new Set(data.map((t) => t.topicName));

    for (let topicName of uniqueTopics) {
      const topicInput: TopicInput = { topicName, source };
      const topic = await TopicModel.create(topicInput);

      let questions = data.filter((obj) => obj.topicName === topicName);
      for (let el of questions) {
        const questionInput: QuestionInput = {
          topic: String(topic._id),
          text: el.text,
        };
        await QuestionModel.create(questionInput);
      }
    }
  }
}
