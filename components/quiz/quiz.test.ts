import { connectToTestDB, disconnectFromDB } from "../../db";
import { quizTestData1, testQuestions, testTopics } from "../../test/testcases";
import { globalUserStore, User } from "../users/user";
import { UserTopicStatusEnum } from "./models/userTopics.model";
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
    topicSliceEnd: 4,
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

  it("getUserTopics", async () => {
    let userTopics = uqclient.getUserTopics();
    expect(userTopics.length).toBe(0);

    const userTopic = await uqclient.initUserTopic();
    userTopics = uqclient.getUserTopics();
    expect(userTopics.length).toBe(1);
    expect(userTopics[0].id).toBe(userTopic.id);
  });

  it("addTopicToUserTopics", async () => {
    try {
      await uqclient.addTopicToUserTopics("");
    } catch (error) {
      const err = error as Error;
      expect(spyGetTopicById).toBeCalled();
      expect(err.message).toBe("Topic doesn't exist");
    }
    const topics = uqclient.getTopics();
    const ut1 = await uqclient.addTopicToUserTopics(topics[0].id);
    expect(ut1.topicId).toBe(topics[0].id);

    const uts = uqclient.getUserTopics();
    expect(uts.length).toBe(1);
    expect(uts[0].id).toBe(ut1.id);
    expect(uts[0].topicId).toBe(topics[0].id);

    const init = await uqclient.initUserTopic();
    expect(spyInitRandomUserTopic).not.toBeCalled();
    expect(init.id).toBe(ut1.id);

    try {
      await uqclient.addTopicToUserTopics(topics[0].id);
    } catch (error) {
      const err = error as Error;
      expect(err.message).toBe("Topic is already added");
    }

    const uts2 = uqclient.getUserTopics();
    expect(uts2.length).toBe(1);
  });

  it("changeCurrentUserTopic", async () => {
    try {
      await uqclient.changeCurrentUserTopic("");
    } catch (error) {
      const err = error as Error;
      expect(spyGetUserTopic).toBeCalled();
      expect(err.message).toBe("UserTopic doesn't exist");
    }

    const initUT = await uqclient.initUserTopic();
    expect(initUT.questionsInRow).toBe(0);
    try {
      await uqclient.changeCurrentUserTopic(initUT.id);
    } catch (error) {
      const err = error as Error;
      expect(err.message).toBe("UserTopic is current already");
    }

    const questions = uqclient.getQuestions();
    await uqclient.learnQuestion(questions[0].id);

    let ut0 = uqclient.getUserTopics().find((ut) => ut.id == initUT.id)!;
    expect(ut0.questionsInRow).toBe(1);
    expect(ut0.status).toBe(UserTopicStatusEnum.current);

    const topics1 = uqclient.getTopics();
    let ut1 = await uqclient.addTopicToUserTopics(topics1[0].id);
    await uqclient.changeCurrentUserTopic(ut1.id);

    const uts1 = uqclient.getUserTopics();
    expect(uts1.length).toBe(2);
    ut0 = uts1.find((ut) => ut.id == initUT.id)!;
    expect(ut0.questionsInRow).toBe(0);
    expect(ut0.status).toBe(UserTopicStatusEnum.started);
    ut1 = uts1.find((ut) => ut.id == ut1.id)!;
    expect(ut1.status).toBe(UserTopicStatusEnum.current);

    const topics2 = uqclient.getTopics();
    const includes = topics2.map((t) => t.id).includes(topics1[0].id);
    expect(includes).toBe(false);
    let ut2 = await uqclient.addTopicToUserTopics(topics2[0].id);
    await uqclient.changeCurrentUserTopic(ut2.id);

    const topics3 = uqclient.getTopics();
    expect(topics3.length).toBe(2);
    const uts2 = uqclient.getUserTopics();
    expect(uts2.length).toBe(3);

    const filtered = uts2.filter(
      (ut) => ut.status == UserTopicStatusEnum.current
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(ut2.id);

    await uqclient.blockUserTopic(ut1.id);
    try {
      await uqclient.changeCurrentUserTopic(ut1.id);
    } catch (error) {
      const err = error as Error;
      expect(err.message).toBe("UserTopic is blocked");
    }

    const uts3 = uqclient.getUserTopics();
    const filtered1 = uts3.filter(
      (ut) => ut.status == UserTopicStatusEnum.current
    );
    expect(filtered1.length).toBe(1);
    expect(filtered1[0].id).toBe(ut2.id);
  });

  it("blockUserTopic", async () => {
    const ut1 = await uqclient.initUserTopic();
    try {
      await uqclient.blockUserTopic(ut1.id);
    } catch (error) {
      const err = error as Error;
      expect(err.message).toBe("Current userTopic cannot be blocked");
    }

    const topics = uqclient.getTopics();
    let ut2 = await uqclient.addTopicToUserTopics(topics[0].id);
    expect(ut2.status).toBe(UserTopicStatusEnum.started);
    ut2 = await uqclient.blockUserTopic(ut2.id);
    expect(ut2.status).toBe(UserTopicStatusEnum.blocked);

    ut2 = await uqclient.blockUserTopic(ut2.id);
    expect(ut2.status).toBe(UserTopicStatusEnum.started);
  });

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
