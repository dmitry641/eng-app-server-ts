import { NextFunction, Request, Response } from "express";
import { SessionModel } from "../components/users/models/sessions.model";
import { globalUserStore } from "../components/users/user";
import { COOKIE_NAME } from "../components/users/users.util";
import Unauthorized from "../exceptions/Unauthorized";
import { cryptr } from "../utils";

async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const encrypted = req.cookies[COOKIE_NAME];
    if (!encrypted) throw new Error();
    const sessionId = cryptr.decrypt(encrypted);
    const session = await SessionModel.findById(sessionId);
    if (!session || !session.valid) throw new Error();
    const user = await globalUserStore.getUser(session.user);
    req.user = user;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    next(new Unauthorized());
  }
}
export default auth;
