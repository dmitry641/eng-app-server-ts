import { NextFunction, Request, Response } from "express";
import Unauthorized from "../../exceptions/Unauthorized";
import { cryptr } from "../../utils";
import { AvailableModules, Statistics } from "../../utils/statistics";
import { SessionModel } from "./models/sessions.model";
import { userService } from "./users.service";
import {
  COOKIE_NAME,
  COOKIE_OPTIONS,
  CreateUserDTO,
  LogInDTO,
  SessionDTO,
  UpdUserSettingsType,
} from "./users.util";

async function signUp(req: Request, res: Response, next: NextFunction) {
  try {
    const createUserDTO: CreateUserDTO = req.body;
    const user = await userService.createUser(createUserDTO);
    const settings = await userService.getSettings(user.id);
    const session = await SessionModel.create({
      user: user.id,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
    });
    const encrypted = cryptr.encrypt(String(session._id));
    res.cookie(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
    return res.json({ user, settings });
  } catch (error) {
    next(error);
  }
}

async function signIn(req: Request, res: Response, next: NextFunction) {
  try {
    const logInDTO: LogInDTO = req.body;
    const user = await userService.validateUser(logInDTO);
    const settings = await userService.getSettings(user.id);
    const session = await SessionModel.create({
      user: user.id,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
    });
    const encrypted = cryptr.encrypt(String(session._id));
    res.cookie(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
    return res.json({ user, settings });
  } catch (error) {
    next(error);
  }
}

async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const user = await userService.getUser(req.userId);
    const settings = await userService.getSettings(req.userId);
    return res.json({ user, settings });
  } catch (error) {
    next(error);
  }
}

async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.sessionId) throw new Unauthorized();
    const sessionId = req.sessionId;
    await SessionModel.updateOne({ _id: sessionId }, { valid: false });
    res.clearCookie(COOKIE_NAME);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

async function getSessions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const sessions = await SessionModel.find({
      user: req.userId,
      valid: true,
    });
    const sessionsDTO = sessions.map((s) => new SessionDTO(s));
    return res.send(sessionsDTO);
  } catch (error) {
    next(error);
  }
}

async function resetSessions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    await SessionModel.updateMany({ user: req.userId }, { valid: false });
    res.clearCookie(COOKIE_NAME);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const updateDTO: UpdUserSettingsType = req.body;
    const settings = await userService.updateSetting(req.userId, updateDTO);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}

async function getStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const statistics = new Statistics(req.userId);
    const modules: AvailableModules[] = ["quiz", "flashcards"];
    statistics.setModules(modules);
    statistics.setDaysCount(7);
    const stats = await statistics.getResult();
    return res.json(stats);
  } catch (error) {
    next(error);
  }
}

export const usersController = {
  signUp,
  signIn,
  getUser,
  logout,
  getSessions,
  resetSessions,
  updateSettings,
  getStatistics,
};
