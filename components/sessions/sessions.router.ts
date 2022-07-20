import { Router } from "express";
const sessionsRouter = Router();

/*
router.get("/refresh", sessionsController.refresh);
router.post(
  "/",
  validateRequest(sessionsSchema),
  validateCaptcha,
  sessionsController.login
);

router.delete("/", auth, sessionsController.logout);
router.get("/", auth, sessionsController.getSessions);
router.delete("/reset", auth, sessionsController.resetSessions);
*/

export default sessionsRouter;
