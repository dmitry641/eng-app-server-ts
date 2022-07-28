import { Router } from "express";
import auth from "../../middleware/auth";
import captcha from "../../middleware/captcha";
import validate from "../../middleware/validate";
import {
  getSessions,
  getUser,
  logout,
  resetSessions,
  signIn,
  signUp,
} from "./users.controller";
import { signInSchema, signUpSchema } from "./users.schema";
const usersRouter = Router();

usersRouter.post("/signup", validate(signUpSchema), captcha, signUp);
usersRouter.post("/signin", validate(signInSchema), captcha, signIn);

usersRouter.get("/", auth, getUser);
usersRouter.delete("/logout", auth, logout);
usersRouter.get("/sessions", auth, getSessions);
usersRouter.delete("/sessions", auth, resetSessions);
// /users/settings/phone/
// /users/statistics

export default usersRouter;
