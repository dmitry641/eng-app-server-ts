import { Router } from "express";
import auth from "../../middleware/auth";
import captcha from "../../middleware/captcha";
import validate from "../../middleware/validate";
import { usersController as uc } from "./users.controller";
import {
  signInSchema,
  signUpSchema,
  updateSettingsSchema,
} from "./users.schema";
const usersRouter = Router();

usersRouter.post("/signup", validate(signUpSchema), captcha, uc.signUp);
usersRouter.post("/signin", validate(signInSchema), captcha, uc.signIn);

usersRouter.get("/", auth, uc.getUser);
usersRouter.delete("/logout", auth, uc.logout);
usersRouter.get("/sessions", auth, uc.getSessions);
usersRouter.delete("/sessions", auth, uc.resetSessions);

usersRouter.post(
  "/settings",
  auth,
  validate(updateSettingsSchema),
  uc.updateSettings
);
// /users/settings/phone/

usersRouter.get("/statistics", auth, uc.getStatistics);

export default usersRouter;
