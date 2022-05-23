import { connectToTestDB, disconnectFromDB } from "../../db";
import { quizTestData1 } from "../../test/testcases";
import { globalUserStore, User } from "../users/user";
import { globalQuizStore } from "./quiz";
import { QuestionService, TopicService } from "./quiz.service";
import { QuizUtil } from "./quiz.util";
import { UserQuizClient, userQuizManager } from "./userQuiz";

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

const spyGlobalGetTopics = jest.spyOn(globalQuizStore, "getTopics");

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

  /**
   * getCurrentUserTopic
   */

  it("initUserTopic", async () => {
    const userTopic = await uqclient.initUserTopic();
    expect(spyInitCurrentUserTopic).toBeCalled();
    expect(spyInitRandomUserTopic).toBeCalled();
    expect(spyGetTopics).toBeCalled();
    expect(spyAddTopicToUserTopics).toBeCalled();
    expect(spyGetUserTopic).toBeCalled();
    expect(spyMakeCurrent).toBeCalled();
    expect(spyUserTopicToDTO).toBeCalled();
  });
  it.todo("getQuestions");

  it.todo("learnQuestion");

  it("getTopics", async () => {
    const topics = uqclient.getTopics();
    expect(spyGetTopics).toBeCalled();
  });
  it.todo("getUserTopics");
  it.todo("getUserTopicById");

  it.todo("addTopicToUserTopics");
  it.todo("changeCurrentUserTopic");

  it.todo("blockUserTopic");

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("filterQuestions", () => {
  it("...", () => {
    expect(1).toBe(1);
  });
});
