import { connectToTestDB, disconnectFromDB } from "../../db";
import { quizTestData1, testQuestions, testTopics } from "../../test/testcases";
import { globalUserStore, User } from "../users/user";
import { globalQuizStore, QuestionDTO, TopicDTO } from "./quiz";
import {
  QuestionService,
  questionSliceEnd,
  TopicService,
  topicSliceEnd,
} from "./quiz.service";
import { QuizUtil } from "./quiz.util";
import {
  filterQuestions,
  filterTopics,
  UserQuestionDTO,
  UserQuizClient,
  userQuizManager,
  UserTopic,
} from "./userQuiz";

async function dropTopicsAndQuestions() {
  const topics = await TopicService.findTopics();
  const questions = await QuestionService.findQuestions();
  if (topics.length) await TopicService.dropTopics();
  if (questions.length) await QuestionService.dropQuestions();
}

describe("Quiz util:", () => {
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    await dropTopicsAndQuestions();
  });
  afterEach(async () => {
    await dropTopicsAndQuestions();
  });

  describe("CreateNewQuestion function", () => {
    it("correct test case", async () => {
      await QuizUtil.createNewQuestion("qwerty", quizTestData1);
      const topics = await TopicService.findTopics();
      const questions = await QuestionService.findQuestions();
      expect(topics.length).toBe(2);
      expect(questions.length).toBe(10);
    });
  });

  describe("CreateCollections function", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });

  describe("QuizDBInitialize function", () => {
    // it("19k documents should be created", async () => {
    // jest.setTimeout(150000);
    // const spyCreateCollections = jest.spyOn(QuizUtil, "createCollections");
    // await quizDBInitialize();
    // expect(spyCreateCollections).toBeCalled();
    // const topics = await TopicService.findTopics();
    // const questions = await QuestionService.findQuestions();
    // expect(topics.length).toBe(791);
    // expect(questions.length).toBe(18929);
    // });
    it("19k documents should not be created", async () => {
      const spyCreateCollections = jest.spyOn(QuizUtil, "createCollections");
      await QuizUtil.createNewQuestion("qwerty", quizTestData1);
      await QuizUtil.quizDBInitialize();
      expect(spyCreateCollections).not.toBeCalled();
      const topics = await TopicService.findTopics();
      const questions = await QuestionService.findQuestions();
      expect(topics.length).toBe(2);
      expect(questions.length).toBe(10);
    });
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("Quiz model service", () => {
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    await dropTopicsAndQuestions();
  });
  afterEach(async () => {
    await dropTopicsAndQuestions();
  });

  describe("Topic service", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });
  describe("Question service", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });
  describe("User topic service", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });
  describe("User question service", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });

  describe("qwe", () => {
    it("asd", async () => {
      const spyCreateCollections = jest.spyOn(QuizUtil, "createCollections");
      expect(spyCreateCollections).not.toBeCalled();
    });
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

jest.mock("./quiz.service", () => {
  const originalModule = jest.requireActual("./quiz.service");

  return {
    __esModule: true,
    ...originalModule,
    topicSliceEnd: 3,
    questionsInRowLIMIT: 2,
    questionSliceEnd: 2,
    oneDay: 200,
  };
});

// --- quiz ---
// @ts-ignore
globalQuizStore.topics = testTopics;
// @ts-ignore
globalQuizStore.questions = testQuestions;

const spyGlobalGetTopics = jest.spyOn(globalQuizStore, "getTopics");
const spyGetQuestionsByTopicId = jest.spyOn(
  globalQuizStore,
  "getQuestionsByTopicId"
);
const spyGetTopicById = jest.spyOn(globalQuizStore, "getTopicById");

// --- user quiz ---
const spyInitCurrentUserTopic = jest.spyOn(
  UserQuizClient.prototype, // @ts-ignore
  "initCurrentUserTopic"
);
const spyInitRandomUserTopic = jest.spyOn(
  UserQuizClient.prototype, // @ts-ignore
  "initRandomUserTopic"
);
const spyGetTopics = jest.spyOn(
  UserQuizClient.prototype, // @ts-ignore
  "getTopics"
);
const spyAddTopicToUserTopics = jest.spyOn(
  UserQuizClient.prototype, // @ts-ignore
  "addTopicToUserTopics"
);
const spyGetUserTopic = jest.spyOn(
  UserQuizClient.prototype, // @ts-ignore
  "getUserTopic"
);
const spyMakeCurrent = jest.spyOn(
  UserQuizClient.prototype, // @ts-ignore
  "makeCurrent"
);
const spyUserTopicToDTO = jest.spyOn(
  UserQuizClient.prototype, // @ts-ignore
  "userTopicToDTO"
);
const spyGetCurrentUserTopic = jest.spyOn(
  UserQuizClient.prototype, // @ts-ignore
  "getCurrentUserTopic"
);

describe("UserQuizClient", () => {
  let user: User;
  let uqclient: UserQuizClient;
  beforeAll(async () => {
    await connectToTestDB();
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    user = await globalUserStore.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    uqclient = await userQuizManager.getUserQuizClient(user);
  });

  it("initUserTopic", async () => {
    const userTopic1 = await uqclient.initUserTopic();
    expect(spyInitCurrentUserTopic).toBeCalled();
    expect(spyInitRandomUserTopic).toBeCalled();
    expect(spyGetTopics).toBeCalled();
    expect(spyAddTopicToUserTopics).toBeCalled();
    expect(spyGetUserTopic).toBeCalled();
    expect(spyMakeCurrent).toBeCalled();
    expect(spyUserTopicToDTO).toBeCalled();
    jest.clearAllMocks();

    const userTopic2 = await uqclient.initUserTopic();
    expect(spyInitRandomUserTopic).not.toBeCalled();
    expect(userTopic1.id).toBe(userTopic2.id);
  });
  it("getQuestions", async () => {
    const fn = () => uqclient.getQuestions();
    expect(fn).toThrowError("Current userTopic is not set");
    expect(spyGetQuestionsByTopicId).not.toBeCalled();
    expect(spyGlobalGetTopics).not.toBeCalled();
    const userTopic = await uqclient.initUserTopic();

    const questions = uqclient.getQuestions();
    expect(spyGetCurrentUserTopic).toBeCalled();
    expect(spyGetTopicById).toBeCalled();
    expect(spyGetQuestionsByTopicId).toBeCalled();
    expect(questions.length).toBe(questionSliceEnd);

    // filter
    // +learn
    // and again
  });

  it.todo("learnQuestion");

  it("getTopics", async () => {
    const topics = uqclient.getTopics();
    expect(spyGetTopics).toBeCalled();
    expect(spyGlobalGetTopics).toBeCalled();
    expect(topics.length).toBe(topicSliceEnd);
    // // +filter test
    // + add topic
    // and again test
  });
  it.todo("getUserTopics");

  it.todo("addTopicToUserTopics");
  it.todo("changeCurrentUserTopic");

  it.todo("blockUserTopic");

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("filterTopics", () => {
  it("should be empty", () => {
    const userTopics1 = [] as UserTopic[];
    const topics1 = [] as TopicDTO[];
    const filtered1 = filterTopics(userTopics1, topics1);
    expect(filtered1.length).toBe(0);

    const userTopics2 = [{ topicId: "1" }] as UserTopic[];
    const topics2 = [{ id: "1" }] as TopicDTO[];
    const filtered2 = filterTopics(userTopics2, topics2);
    expect(filtered2.length).toBe(0);

    const userTopics3 = [
      { topicId: "3" },
      { topicId: "1" },
      { topicId: "2" },
    ] as UserTopic[];
    const topics3 = [{ id: "1" }, { id: "3" }, { id: "2" }] as TopicDTO[];
    const filtered3 = filterTopics(userTopics3, topics3);
    expect(filtered3.length).toBe(0);
  });
  it("should not be empty", () => {
    const userTopics1 = [] as UserTopic[];
    const topics1 = [{ id: "1" }] as TopicDTO[];
    const filtered1 = filterTopics(userTopics1, topics1);
    expect(filtered1.length).toBe(1);

    const userTopics2 = [{ topicId: "1" }] as UserTopic[];
    const topics2 = [{ id: "1" }, { id: "2" }, { id: "3" }] as TopicDTO[];
    const filtered2 = filterTopics(userTopics2, topics2);
    expect(filtered2.length).toBe(2);

    const userTopics3 = [
      { topicId: "4" },
      { topicId: "5" },
      { topicId: "6" },
      { topicId: "7" },
    ] as UserTopic[];
    const topics3 = [
      { id: "1" },
      { id: "2" },
      { id: "3" },
      { id: "4" },
    ] as TopicDTO[];
    const filtered3 = filterTopics(userTopics3, topics3);
    expect(filtered3.length).toBe(3);
  });
});

describe("filterQuestions", () => {
  it("should be empty", () => {
    const userQuestions1 = [] as UserQuestionDTO[];
    const questions1 = [] as QuestionDTO[];
    const filtered1 = filterQuestions(userQuestions1, questions1);
    expect(filtered1.length).toBe(0);

    const userQuestions2 = [{ questionId: "1" }] as UserQuestionDTO[];
    const questions2 = [{ id: "1" }] as QuestionDTO[];
    const filtered2 = filterQuestions(userQuestions2, questions2);
    expect(filtered2.length).toBe(0);

    const userQuestions3 = [
      { questionId: "3" },
      { questionId: "1" },
      { questionId: "2" },
    ] as UserQuestionDTO[];
    const questions3 = [{ id: "1" }, { id: "3" }, { id: "2" }] as QuestionDTO[];
    const filtered3 = filterQuestions(userQuestions3, questions3);
    expect(filtered3.length).toBe(0);
  });
  it("should not be empty", () => {
    const userQuestions1 = [] as UserQuestionDTO[];
    const questions1 = [{ id: "1" }] as QuestionDTO[];
    const filtered1 = filterQuestions(userQuestions1, questions1);
    expect(filtered1.length).toBe(1);

    const userQuestions2 = [{ questionId: "1" }] as UserQuestionDTO[];
    const questions2 = [{ id: "1" }, { id: "2" }, { id: "3" }] as QuestionDTO[];
    const filtered2 = filterQuestions(userQuestions2, questions2);
    expect(filtered2.length).toBe(2);

    const userQuestions3 = [
      { questionId: "4" },
      { questionId: "5" },
      { questionId: "6" },
      { questionId: "7" },
    ] as UserQuestionDTO[];
    const questions3 = [
      { id: "1" },
      { id: "2" },
      { id: "3" },
      { id: "4" },
    ] as QuestionDTO[];
    const filtered3 = filterQuestions(userQuestions3, questions3);
    expect(filtered3.length).toBe(3);
  });
});
