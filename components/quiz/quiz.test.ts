import { connectToTestDB, disconnectFromDB } from "../../db";
import { quizTestData1 } from "../../test/testcases";
import { QuestionService, TopicService } from "./quiz.service";
import { QuizUtil } from "./quiz.util";

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

describe("Quiz functions", () => {
  describe("getCurrentUserTopic", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });
  describe("getProcessedQuestions", () => {
    it("...", () => {
      expect(1).toBe(1);
    });
  });
});
