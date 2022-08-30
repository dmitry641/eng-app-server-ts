import { ObjectID } from "bson";
import { connectToTestDB, disconnectFromDB } from "../../db";
import { quizTestData1, testQuestions, testTopics } from "../../test/testcases";
import { sleep } from "../../utils";
import { userService } from "../users/users.service";
import {
  IQuestion,
  QuestionInput,
  QuestionModel,
} from "./models/questions.model";
import { ITopic, TopicInput, TopicModel } from "./models/topics.model";
import { IUserTopic } from "./models/userTopics.model";
import { QuizDB, quizService, QuizService } from "./quiz.service";
import {
  filterQuestions,
  filterTopics,
  LearnedQuestion,
  oneDay,
  questionSliceEnd,
  topicSliceEnd,
  UTStatus,
} from "./quiz.util";

async function dropTopicsAndQuestions() {
  const topics = await TopicModel.find({});
  const questions = await QuestionModel.find({});
  if (topics.length) await TopicModel.collection.drop();
  if (questions.length) await QuestionModel.collection.drop();
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
      await QuizDB.createNewQuestion("qwerty", quizTestData1);
      const topics = await TopicModel.find({});
      const questions = await QuestionModel.find({});
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
      const spyCreateCollections = jest.spyOn(QuizDB, "createCollections");
      await QuizDB.createNewQuestion("qwerty", quizTestData1);
      await QuizDB.saturate();
      expect(spyCreateCollections).not.toBeCalled();
      const topics = await TopicModel.find({});
      const questions = await QuestionModel.find({});
      expect(topics.length).toBe(2);
      expect(questions.length).toBe(10);
    });
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

jest.mock("./quiz.util", () => {
  const originalModule = jest.requireActual("./quiz.util");

  return {
    __esModule: true,
    ...originalModule,
    topicSliceEnd: 4,
    questionsInRowLIMIT: 2,
    questionSliceEnd: 2,
    oneDay: 200,
  };
});

const spyInitCurrentUserTopic = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "initCurrentUserTopic"
);
const spyInitRandomUserTopic = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "initRandomUserTopic"
);
const spyGetTopics = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "getTopics"
);
const spyAddTopicToUserTopics = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "addTopicToUserTopics"
);
const spyMakeCurrent = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "makeCurrent"
);
const spyUserTopicToDTO = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "userTopicToDTO"
);
const spyGetCurrentUT = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "getCurrentUT"
);
const spyFindQuestions = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "findIQuestions"
);
const spyFindOneTopic = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "findOneITopic"
);
const spyFindOneUserTopic = jest.spyOn(
  QuizService.prototype, // @ts-ignore
  "findOneIUserTopic"
);

describe("UserQuizClient", () => {
  let userId: string;
  beforeAll(async () => {
    await connectToTestDB();

    for (const topicDTO of testTopics) {
      const topicInput: TopicInput = {
        topicName: topicDTO.topicName,
        source: topicDTO.source,
      };
      const topic = await TopicModel.create(topicInput);

      let questions = testQuestions.filter((q) => q.topicId === topicDTO.id);
      for (let el of questions) {
        const questionInput: QuestionInput = {
          topic: String(topic._id),
          text: el.text,
        };
        await QuestionModel.create(questionInput);
      }
    }
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    const user = await userService.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    userId = user.id;
  });

  it("initUserTopic", async () => {
    const userTopic1 = await quizService.initUserTopic(userId);
    expect(spyInitCurrentUserTopic).toBeCalled();
    expect(spyInitRandomUserTopic).toBeCalled();
    expect(spyGetTopics).toBeCalled();
    expect(spyAddTopicToUserTopics).toBeCalled();
    expect(spyMakeCurrent).toBeCalled();
    expect(spyUserTopicToDTO).toBeCalled();
    jest.clearAllMocks();

    const userTopic2 = await quizService.initUserTopic(userId);
    expect(spyInitRandomUserTopic).not.toBeCalled();
    expect(userTopic1.id).toBe(userTopic2.id);
  });

  it("initCurrentUserTopic", async () => {
    const topics = await quizService.getTopics(userId);
    const topic = topics[0];
    const ut1 = await quizService.addTopicToUserTopics(userId, topic.id);
    expect(ut1.status).toBe(UTStatus.started);

    const init = await quizService.initUserTopic(userId);
    expect(init.id).toBe(ut1.id);
    expect(init.status).toBe(UTStatus.current);

    for (let i = 0; i < 3; i++) {
      await quizService.initUserTopic(userId);
      const questions = await quizService.getQuestions(userId);
      for (const q of questions) {
        await quizService.learnQuestion(userId, q.id);
      }
      await sleep(15);
    }

    await sleep(oneDay);

    const ut2 = await quizService.initUserTopic(userId);
    expect(ut2.id).toBe(ut1.id);
  });

  it("getQuestions", async () => {
    let errMsg;
    try {
      await quizService.getQuestions(userId);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Current userTopic is not set");

    expect(spyFindQuestions).not.toBeCalled();
    await quizService.initUserTopic(userId);

    const questions = await quizService.getQuestions(userId);
    expect(spyGetCurrentUT).toBeCalled();
    expect(spyFindOneTopic).toBeCalled();
    expect(spyFindQuestions).toBeCalled();
    expect(questions.length).toBe(questionSliceEnd);
  });

  it("learnQuestion", async () => {
    let errMsg;
    const ut1 = await quizService.initUserTopic(userId);
    let questions = await quizService.getQuestions(userId);
    expect(questions.length).toBe(questionSliceEnd);

    const topics = await quizService.getTopics(userId);
    const otherQuestions = await QuestionModel.find({ topic: topics[0].id });
    for (const qId of ["", String(otherQuestions[0]._id)]) {
      try {
        await quizService.learnQuestion(userId, qId);
      } catch (error) {
        const err = error as Error;
        errMsg = err.message;
      }
      expect(errMsg).toBe("Question not found");
    }

    const obj1 = await quizService.learnQuestion(userId, questions[0].id);
    expect(obj1.changeTopic).toBe(false);
    const currentUT = await quizService.initUserTopic(userId);
    const qIds = currentUT.learnedQuestions.map((el) => el.qId);
    expect(qIds).toContain(questions[0].id);

    try {
      await quizService.learnQuestion(userId, questions[0].id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Question is already learned");

    const ut2 = await quizService.initUserTopic(userId);
    expect(ut2.questionsInRow).toBe(1);
    expect(ut2.id).toBe(ut1.id);

    const obj2 = await quizService.learnQuestion(userId, questions[1].id);
    expect(obj2.changeTopic).toBe(true);

    try {
      await quizService.getQuestions(userId);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Current userTopic is not set");

    const uts = await quizService.getUserTopics(userId);
    const ut3 = uts.find((ut) => ut.id === ut2.id)!;
    expect(ut3.status).toBe(UTStatus.paused);
    expect(ut3.questionsInRow).toBe(0);

    const ut4 = await quizService.selectUserTopic(userId, ut3.id);
    expect(ut4.id).toBe(ut1.id);

    questions = await quizService.getQuestions(userId);
    const obj3 = await quizService.learnQuestion(userId, questions[0].id);
    expect(obj3.changeTopic).toBe(false);
    const obj4 = await quizService.learnQuestion(userId, questions[1].id);
    expect(obj4.changeTopic).toBe(true);

    const ut5 = await quizService.selectUserTopic(userId, ut4.id);
    expect(ut5.id).toBe(ut2.id);

    questions = await quizService.getQuestions(userId);
    expect(questions.length).toBe(1);
    const obj5 = await quizService.learnQuestion(userId, questions[0].id);
    expect(obj5.changeTopic).toBe(true);

    const uts2 = await quizService.getUserTopics(userId);
    const ut6 = uts2.find((ut) => ut.id === ut5.id)!;
    expect(ut6.status).toBe(UTStatus.finished);

    try {
      await quizService.selectUserTopic(userId, ut6.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("UserTopic is finished");

    try {
      await quizService.blockUserTopic(userId, ut6.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Finished userTopic cannot be blocked");

    const utopics = await quizService.getUserTopics(userId);
    const statuses = utopics.map((ut) => ut.status);
    const current = statuses.find((s) => s == UTStatus.current);
    expect(current).toBeUndefined();
  });

  it("getTopics", async () => {
    const topics = await quizService.getTopics(userId);
    expect(spyGetTopics).toBeCalled();
    expect(topics.length).toBe(topicSliceEnd);
  });

  it("getUserTopics", async () => {
    let userTopics = await quizService.getUserTopics(userId);
    expect(userTopics.length).toBe(0);

    const userTopic = await quizService.initUserTopic(userId);
    userTopics = await quizService.getUserTopics(userId);
    expect(userTopics.length).toBe(1);
    expect(userTopics[0].id).toBe(userTopic.id);
  });

  it("addTopicToUserTopics", async () => {
    let errMsg;
    try {
      await quizService.addTopicToUserTopics(userId, String(new ObjectID()));
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(spyFindOneTopic).toBeCalled();
    expect(errMsg).toBe("Topic doesn't exist");

    const topics = await quizService.getTopics(userId);
    const ut1 = await quizService.addTopicToUserTopics(userId, topics[0].id);
    expect(ut1.topicId).toBe(topics[0].id);

    const uts = await quizService.getUserTopics(userId);
    expect(uts.length).toBe(1);
    expect(uts[0].id).toBe(ut1.id);
    expect(uts[0].topicId).toBe(topics[0].id);

    const init = await quizService.initUserTopic(userId);
    expect(spyInitRandomUserTopic).not.toBeCalled();
    expect(init.id).toBe(ut1.id);

    try {
      await quizService.addTopicToUserTopics(userId, topics[0].id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Topic is already added");

    const uts2 = await quizService.getUserTopics(userId);
    expect(uts2.length).toBe(1);
  });

  it("selectUserTopic", async () => {
    let errMsg;
    try {
      await quizService.selectUserTopic(userId, String(new ObjectID()));
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("UserTopic doesn't exist");
    expect(spyFindOneUserTopic).toBeCalled();

    const initUT = await quizService.initUserTopic(userId);
    expect(initUT.questionsInRow).toBe(0);
    try {
      await quizService.selectUserTopic(userId, initUT.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("UserTopic is current already");

    const questions = await quizService.getQuestions(userId);
    await quizService.learnQuestion(userId, questions[0].id);

    const uts = await quizService.getUserTopics(userId);
    let ut0 = uts.find((ut) => ut.id === initUT.id)!;
    expect(ut0.questionsInRow).toBe(1);
    expect(ut0.status).toBe(UTStatus.current);

    const topics1 = await quizService.getTopics(userId);
    let ut1 = await quizService.addTopicToUserTopics(userId, topics1[0].id);
    await quizService.selectUserTopic(userId, ut1.id);

    const uts1 = await quizService.getUserTopics(userId);
    expect(uts1.length).toBe(2);
    ut0 = uts1.find((ut) => ut.id == initUT.id)!;
    expect(ut0.questionsInRow).toBe(0);
    expect(ut0.status).toBe(UTStatus.started);
    ut1 = uts1.find((ut) => ut.id == ut1.id)!;
    expect(ut1.status).toBe(UTStatus.current);

    const topics2 = await quizService.getTopics(userId);
    const includes = topics2.map((t) => t.id).includes(topics1[0].id);
    expect(includes).toBe(false);
    let ut2 = await quizService.addTopicToUserTopics(userId, topics2[0].id);
    await quizService.selectUserTopic(userId, ut2.id);

    const topics3 = await quizService.getTopics(userId);
    expect(topics3.length).toBe(2);
    const uts2 = await quizService.getUserTopics(userId);
    expect(uts2.length).toBe(3);

    const filtered = uts2.filter((ut) => ut.status == UTStatus.current);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(ut2.id);

    await quizService.blockUserTopic(userId, ut1.id);
    try {
      await quizService.selectUserTopic(userId, ut1.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("UserTopic is blocked");

    const uts3 = await quizService.getUserTopics(userId);
    const filtered1 = uts3.filter((ut) => ut.status == UTStatus.current);
    expect(filtered1.length).toBe(1);
    expect(filtered1[0].id).toBe(ut2.id);
  });

  it("blockUserTopic", async () => {
    let errMsg;
    const ut1 = await quizService.initUserTopic(userId);
    try {
      await quizService.blockUserTopic(userId, ut1.id);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Current userTopic cannot be blocked");

    const topics = await quizService.getTopics(userId);
    let ut2 = await quizService.addTopicToUserTopics(userId, topics[0].id);
    expect(ut2.status).toBe(UTStatus.started);
    ut2 = await quizService.blockUserTopic(userId, ut2.id);
    expect(ut2.status).toBe(UTStatus.blocked);

    ut2 = await quizService.blockUserTopic(userId, ut2.id);
    expect(ut2.status).toBe(UTStatus.started);
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});

describe("filterTopics", () => {
  it("should be empty", () => {
    const userTopics1 = [] as IUserTopic[];
    const topics1 = [] as ITopic[];
    const filtered1 = filterTopics(userTopics1, topics1);
    expect(filtered1.length).toBe(0);

    const userTopics2 = [{ topic: "1" }] as IUserTopic[];
    const topics2 = [{ _id: "1" }] as ITopic[];
    const filtered2 = filterTopics(userTopics2, topics2);
    expect(filtered2.length).toBe(0);

    const userTopics3 = [
      { topic: "3" },
      { topic: "1" },
      { topic: "2" },
    ] as IUserTopic[];
    const topics3 = [{ _id: "1" }, { _id: "3" }, { _id: "2" }] as ITopic[];
    const filtered3 = filterTopics(userTopics3, topics3);
    expect(filtered3.length).toBe(0);
  });
  it("should not be empty", () => {
    const userTopics1 = [] as IUserTopic[];
    const topics1 = [{ _id: "1" }] as ITopic[];
    const filtered1 = filterTopics(userTopics1, topics1);
    expect(filtered1.length).toBe(1);

    const userTopics2 = [{ topic: "1" }] as IUserTopic[];
    const topics2 = [{ _id: "1" }, { _id: "2" }, { _id: "3" }] as ITopic[];
    const filtered2 = filterTopics(userTopics2, topics2);
    expect(filtered2.length).toBe(2);

    const userTopics3 = [
      { topic: "4" },
      { topic: "5" },
      { topic: "6" },
      { topic: "7" },
    ] as IUserTopic[];
    const topics3 = [
      { _id: "1" },
      { _id: "2" },
      { _id: "3" },
      { _id: "4" },
    ] as ITopic[];
    const filtered3 = filterTopics(userTopics3, topics3);
    expect(filtered3.length).toBe(3);
  });
});

describe("filterQuestions", () => {
  it("should be empty", () => {
    const learnedQuestion1: LearnedQuestion[] = [];
    const questions1 = [] as IQuestion[];
    const filtered1 = filterQuestions(learnedQuestion1, questions1);
    expect(filtered1.length).toBe(0);

    const learnedQuestion2: LearnedQuestion[] = [{ qId: "1", date: 1 }];
    const questions2 = [{ _id: "1" }] as IQuestion[];
    const filtered2 = filterQuestions(learnedQuestion2, questions2);
    expect(filtered2.length).toBe(0);

    const learnedQuestion3: LearnedQuestion[] = [
      { qId: "3", date: 1 },
      { qId: "1", date: 1 },
      { qId: "2", date: 1 },
    ];
    const questions3 = [
      { _id: "1" },
      { _id: "3" },
      { _id: "2" },
    ] as IQuestion[];
    const filtered3 = filterQuestions(learnedQuestion3, questions3);
    expect(filtered3.length).toBe(0);
  });
  it("should not be empty", () => {
    const learnedQuestion1: LearnedQuestion[] = [];
    const questions1 = [{ _id: "1" }] as IQuestion[];
    const filtered1 = filterQuestions(learnedQuestion1, questions1);
    expect(filtered1.length).toBe(1);

    const learnedQuestion2: LearnedQuestion[] = [{ qId: "1", date: 1 }];
    const questions2 = [
      { _id: "1" },
      { _id: "2" },
      { _id: "3" },
    ] as IQuestion[];
    const filtered2 = filterQuestions(learnedQuestion2, questions2);
    expect(filtered2.length).toBe(2);

    const learnedQuestion3: LearnedQuestion[] = [
      { qId: "4", date: 1 },
      { qId: "5", date: 1 },
      { qId: "6", date: 1 },
      { qId: "7", date: 1 },
    ];
    const questions3 = [
      { _id: "1" },
      { _id: "2" },
      { _id: "3" },
      { _id: "4" },
    ] as IQuestion[];
    const filtered3 = filterQuestions(learnedQuestion3, questions3);
    expect(filtered3.length).toBe(3);
  });
});
