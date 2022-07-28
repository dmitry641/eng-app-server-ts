import { NextFunction, Request, Response } from "express";
import Unauthorized from "../../exceptions/Unauthorized";
import { cryptr } from "../../utils";
import { SessionModel } from "./models/sessions.model";
import { globalUserStore } from "./user";
import {
  CreateUserDTO,
  LogInDTO,
  SessionDTO,
  UserDTO,
  UserSettingsDTO,
} from "./users.dto";
import { COOKIE_NAME, COOKIE_OPTIONS } from "./users.util";

export async function signUp(req: Request, res: Response, next: NextFunction) {
  try {
    const createUserDTO: CreateUserDTO = req.body;
    const user = await globalUserStore.createUser(createUserDTO);
    const userDTO = new UserDTO(user);
    const userSettingsDTO = new UserSettingsDTO(user);
    const session = await SessionModel.create({
      user: userDTO.id,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
    });
    const encrypted = cryptr.encrypt(String(session._id));
    res.cookie(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
    return res.json({ user: userDTO, settings: userSettingsDTO });
  } catch (error) {
    next(error);
  }
}

export async function signIn(req: Request, res: Response, next: NextFunction) {
  try {
    const logInDTO: LogInDTO = req.body;
    const user = await globalUserStore.validateUser(logInDTO);
    const userDTO = new UserDTO(user);
    const userSettingsDTO = new UserSettingsDTO(user);
    const session = await SessionModel.create({
      user: userDTO.id,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
    });
    const encrypted = cryptr.encrypt(String(session._id));
    res.cookie(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
    return res.json({ user: userDTO, settings: userSettingsDTO });
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const userDTO = new UserDTO(req.user);
    const userSettingsDTO = new UserSettingsDTO(req.user);
    return res.json({ user: userDTO, settings: userSettingsDTO });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
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

export async function getSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const userId = req.user.id;
    const sessions = await SessionModel.find({
      user: userId,
      valid: true,
    });
    const sessionsDTO = sessions.map((el) => new SessionDTO(el));
    return res.send(sessionsDTO);
  } catch (error) {
    next(error);
  }
}

export async function resetSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const userId = req.user.id;
    await SessionModel.updateMany({ user: userId }, { valid: false });
    res.clearCookie(COOKIE_NAME);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
