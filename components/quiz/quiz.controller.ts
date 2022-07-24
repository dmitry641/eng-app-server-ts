import axios from "axios";
import { NextFunction, Request, Response } from "express";
import BadRequest from "../../exceptions/BadRequest";
import Unauthorized from "../../exceptions/Unauthorized";
import { randomIntFromInterval, shuffle } from "../../utils";
import {
  ImageDto,
  QType,
  TType,
  UnsplashImage,
  UnsplashResponse,
  UTType,
} from "./types";
import { userQuizManager } from "./userQuiz";
const count = 10;
const apiRoot = process.env.UNSPLASH_API_URL;
const accessKey = process.env.UNSPLASH_ACCESS_KEY;

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

export async function searchImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { search, width = 0 } = req.query;
    if (!search) throw new BadRequest();
    const isMobile: boolean = Number(width) <= 600;
    const orientation = isMobile ? "portrait" : "landscape";

    let url = `${apiRoot}/search/photos?client_id=${accessKey}&count=${count}&orientation=${orientation}&query=${search}`;
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

export async function randomImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { width = 0 } = req.query;
    const isMobile: boolean = Number(width) <= 600;
    const orientation = isMobile ? "portrait" : "landscape";
    let url = `${apiRoot}/photos/random?client_id=${accessKey}&count=${count}&orientation=${orientation}`;
    const response = await axios.get<UnsplashImage[]>(url);
    const json = response.data.map((el) => new ImageDto(el));
    return res.json(json);
  } catch (error) {
    next(error);
  }
}
