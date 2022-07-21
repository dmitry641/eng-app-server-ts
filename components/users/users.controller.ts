import { NextFunction, Request, Response } from "express";
import { cryptr } from "../../utils";
import { RequestWithUser } from "../../utils/interfaces";
import { SessionModel } from "./models/sessions.model";
import { globalUserStore } from "./user";
import { CreateUserDTO, LogInDTO, UserDTO } from "./users.dto";
import { COOKIE_NAME, COOKIE_OPTIONS } from "./users.util";

export async function singUp(req: Request, res: Response, next: NextFunction) {
  try {
    const createUserDTO: CreateUserDTO = req.body;
    const user = await globalUserStore.createUser(createUserDTO);
    const userDTO = new UserDTO(user);
    const session = await SessionModel.create({
      user: userDTO.id,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
    });
    const encrypted = cryptr.encrypt(String(session._id));
    res.cookie(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
    return res.json({ user: userDTO });
  } catch (error) {
    next(error);
  }
}

export async function singIn(req: Request, res: Response, next: NextFunction) {
  try {
    const logInDTO: LogInDTO = req.body;
    const user = await globalUserStore.validateUser(logInDTO);
    const userDTO = new UserDTO(user);
    const session = await SessionModel.create({
      user: userDTO.id,
      userAgent: req.headers["user-agent"] || "",
      ip: req.ip || req.headers["x-forwarded-for"] || "",
    });
    const encrypted = cryptr.encrypt(String(session._id));
    res.cookie(COOKIE_NAME, encrypted, COOKIE_OPTIONS);
    return res.json({ user: userDTO });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.sessionId) throw new Error();
    const sessionId = req.sessionId;
    await SessionModel.updateOne({ _id: sessionId }, { valid: false });
    res.clearCookie(COOKIE_NAME);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export async function getSessions(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Error();
    const userId = req.user.id;
    const sessions = await SessionModel.find({
      user: userId,
      valid: true,
    });
    return res.send(sessions);
  } catch (error) {
    next(error);
  }
}

export async function resetSessions(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Error();
    const userId = req.user.id;
    await SessionModel.updateMany({ user: userId }, { valid: false });
    res.clearCookie(COOKIE_NAME);
    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}
