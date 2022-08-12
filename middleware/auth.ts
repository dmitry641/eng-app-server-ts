import { NextFunction, Request, Response } from "express";
import { SessionModel } from "../components/users/models/sessions.model";
import { userService } from "../components/users/users.service";
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
    // если делать через JWT, то в sub можно хранить
    // user.id и тут его просто записывать в запрос req.userId = token.sub
    // без лишнего обрашения к бд
    // (при валидном аксесс токене, а при валидном рефреш токене - обращение будет)
    const user = await userService.getUser(String(session.user));
    req.userId = user.id;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    next(new Unauthorized());
  }
}
export default auth;
