import { Router } from "express";
const usersRouter = Router();
/*
// /users/
// /users/settings/phone/
// /users/statistics
usersRouter.post(
  "/",
  validateRequest(usersSchema),
  validateCaptcha,
  usersController.registration
);
usersRouter.put(
  "/phone",
  auth,
  validateRequest(phoneSchema),
  usersController.changePhone
);
usersRouter.get("/phone/verif/", auth, usersController.verifPhoneInit);
usersRouter.post("/phone/verif/", auth, usersController.verifPhoneCheck);
*/
export default usersRouter;
