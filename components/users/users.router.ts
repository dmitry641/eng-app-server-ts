import { Router } from "express";
import auth from "../../middleware/auth";
import captcha from "../../middleware/captcha";
import validate from "../../middleware/validate";
import {
  getSessions,
  logout,
  resetSessions,
  singIn,
  singUp,
} from "./users.controller";
import { singInSchema, singUpSchema } from "./users.schema";
const usersRouter = Router();

usersRouter.post("/singup", validate(singUpSchema), captcha, singUp);
usersRouter.post("/singin", validate(singInSchema), captcha, singIn);
usersRouter.delete("/logout", auth, logout);
usersRouter.get("/sessions", auth, getSessions);
usersRouter.delete("/sessions", auth, resetSessions);
// /users/settings/phone/
// /users/statistics

export default usersRouter;
