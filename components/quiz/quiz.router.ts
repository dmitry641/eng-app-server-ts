import { Router } from "express";
import validate from "../../middleware/validate";
import { quizController as qc } from "./quiz.controller";
import { QSchema, TSchema, UTSchema } from "./quiz.schema";
const quizRouter = Router();

quizRouter.get("/init", qc.initUserTopic);
quizRouter.get("/", qc.getUserTopics);
quizRouter.post("/select", validate(UTSchema), qc.selectUserTopic);
quizRouter.post("/block", validate(UTSchema), qc.blockUserTopic);

quizRouter.get("/topics", qc.getTopics);
quizRouter.post("/topics", validate(TSchema), qc.addTopicToUserTopics);

quizRouter.get("/questions", qc.getQuestions);
quizRouter.post("/questions", validate(QSchema), qc.learnQuestion);

quizRouter.get("/images/", qc.getImages);

export default quizRouter;
