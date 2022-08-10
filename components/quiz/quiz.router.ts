import { Router } from "express";
import validate from "../../middleware/validate";
import {
  addTopicToUserTopics,
  blockUserTopic,
  changeCurrentUserTopic,
  getImages,
  getQuestions,
  getTopics,
  getUserTopics,
  initUserTopic,
  learnQuestion,
} from "./quiz.controller";
import { QSchema, TSchema, UTSchema } from "./quiz.schema";
const quizRouter = Router();

quizRouter.get("/init", initUserTopic);
quizRouter.get("/", getUserTopics);
quizRouter.post("/change", validate(UTSchema), changeCurrentUserTopic);
quizRouter.post("/block", validate(UTSchema), blockUserTopic);

quizRouter.get("/topics", getTopics);
quizRouter.post("/topics", validate(TSchema), addTopicToUserTopics);

quizRouter.get("/questions", getQuestions);
quizRouter.post("/questions", validate(QSchema), learnQuestion);

quizRouter.get("/images/", getImages);

export default quizRouter;
