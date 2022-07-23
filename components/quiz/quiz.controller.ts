import { NextFunction, Request, Response } from "express";
import Unauthorized from "../../exceptions/Unauthorized";
import { QType, TType, UTType } from "./types";
import { userQuizManager } from "./userQuiz";

export async function initUserTopic(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const uqclient = await userQuizManager.getUserQuizClient(req.user);
    const userTopic = await uqclient.initUserTopic();
    return res.send(userTopic);
  } catch (error) {
    next(error);
  }
}
export async function getUserTopics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const uqclient = await userQuizManager.getUserQuizClient(req.user);
    const userTopics = uqclient.getUserTopics();
    return res.send(userTopics);
  } catch (error) {
    next(error);
  }
}
export async function changeCurrentUserTopic(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userTopicId }: UTType = req.body;
    const uqclient = await userQuizManager.getUserQuizClient(req.user);
    const userTopic = await uqclient.changeCurrentUserTopic(userTopicId);
    return res.send(userTopic);
  } catch (error) {
    next(error);
  }
}
export async function blockUserTopic(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userTopicId }: UTType = req.body;
    const uqclient = await userQuizManager.getUserQuizClient(req.user);
    const userTopic = await uqclient.blockUserTopic(userTopicId);
    return res.send(userTopic);
  } catch (error) {
    next(error);
  }
}

export async function getTopics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const uqclient = await userQuizManager.getUserQuizClient(req.user);
    const topics = uqclient.getTopics();
    return res.send(topics);
  } catch (error) {
    next(error);
  }
}
export async function addTopicToUserTopics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { topicId }: TType = req.body;
    const uqclient = await userQuizManager.getUserQuizClient(req.user);
    const userTopic = await uqclient.addTopicToUserTopics(topicId);
    return res.send(userTopic);
  } catch (error) {
    next(error);
  }
}

export async function getQuestions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const uqclient = await userQuizManager.getUserQuizClient(req.user);
    const questions = uqclient.getQuestions();
    return res.send(questions);
  } catch (error) {
    next(error);
  }
}
export async function learnQuestion(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { questionId }: QType = req.body;
    const uqclient = await userQuizManager.getUserQuizClient(req.user);
    const userTopic = await uqclient.learnQuestion(questionId);
    return res.send(userTopic);
  } catch (error) {
    next(error);
  }
}
