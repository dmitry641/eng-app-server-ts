import axios from "axios";
import { NextFunction, Request, Response } from "express";
import Unauthorized from "../../exceptions/Unauthorized";
import { randomIntFromInterval, shuffle } from "../../utils";
import { quizService } from "./quiz.service";
import {
  accessKey,
  apiRoot,
  ImageDto,
  images_count,
  QType,
  TType,
  UnsplashImage,
  UnsplashResponse,
  UTType,
} from "./quiz.util";

async function initUserTopic(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const currentUT = await quizService.initUserTopic(req.user.id);
    // const questions = uqclient.getQuestions();
    return res.send(currentUT);
  } catch (error) {
    next(error);
  }
}
async function getUserTopics(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const userTopics = await quizService.getUserTopics(req.user.id);
    return res.send(userTopics);
  } catch (error) {
    next(error);
  }
}
async function selectUserTopic(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userTopicId }: UTType = req.body;
    const currentUT = await quizService.selectUserTopic(
      req.user.id,
      userTopicId
    );
    const userTopics = await quizService.getUserTopics(req.user.id);
    const questions = await quizService.getQuestions(req.user.id);
    return res.send({ currentUT, userTopics, questions });
  } catch (error) {
    next(error);
  }
}
async function blockUserTopic(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userTopicId }: UTType = req.body;
    const userTopic = await quizService.blockUserTopic(
      req.user.id,
      userTopicId
    );
    return res.send(userTopic);
  } catch (error) {
    next(error);
  }
}

async function getTopics(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const topics = await quizService.getTopics(req.user.id);
    return res.send(topics);
  } catch (error) {
    next(error);
  }
}
async function addTopicToUserTopics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { topicId }: TType = req.body;
    const newUT = await quizService.addTopicToUserTopics(req.user.id, topicId);
    const currentUT = await quizService.selectUserTopic(req.user.id, newUT.id);
    const userTopics = await quizService.getUserTopics(req.user.id);
    const questions = await quizService.getQuestions(req.user.id);
    return res.send({ userTopics, currentUT, questions });
  } catch (error) {
    next(error);
  }
}

async function getQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const questions = await quizService.getQuestions(req.user.id);
    return res.send(questions);
  } catch (error) {
    next(error);
  }
}
async function learnQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const { questionId }: QType = req.body;
    const object = await quizService.learnQuestion(req.user.id, questionId);
    return res.send(object);
  } catch (error) {
    next(error);
  }
}

async function getImages(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, width = 0 } = req.query;
    const isMobile: boolean = Number(width) <= 600;
    const orientation = isMobile ? "portrait" : "landscape";
    if (!search) {
      let url = `${apiRoot}/photos/random?client_id=${accessKey}&count=${images_count}&orientation=${orientation}`;
      const response = await axios.get<UnsplashImage[]>(url);
      const json = response.data.map((el) => new ImageDto(el));
      return res.json(json);
    }

    let url = `${apiRoot}/search/photos?client_id=${accessKey}&count=${images_count}&orientation=${orientation}&query=${search}`;
    const response1 = await axios.get<UnsplashResponse>(url);
    if (response1.data.total_pages === 0) {
      return res.json([]);
    }
    url += `&page=${randomIntFromInterval(
      1,
      Math.round(response1.data.total_pages * 0.1)
    )}`;

    const response2 = await axios.get<UnsplashResponse>(url);
    const json = response2.data.results.map((el) => new ImageDto(el));
    return res.json(shuffle(json));
  } catch (error) {
    next(error);
  }
}

export const quizController = {
  initUserTopic,
  getUserTopics,
  selectUserTopic,
  blockUserTopic,
  getTopics,
  addTopicToUserTopics,
  getQuestions,
  learnQuestion,
  getImages,
};
