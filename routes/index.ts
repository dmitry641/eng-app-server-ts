import { Router } from "express";
import decksRouter from "../components/decks/decks.router";
import flashcardsRouter from "../components/flashcards/flashcards.router";
import quizRouter from "../components/quiz/quiz.router";
import usersRouter from "../components/users/users.router";
import auth from "../middleware/auth";
const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/decks", auth, decksRouter);
apiRouter.use("/flashcards", auth, flashcardsRouter);
apiRouter.use("/quiz", auth, quizRouter);

// FIXME
// apiRouter.use("/shop", auth, shopRouter);

export default apiRouter;
