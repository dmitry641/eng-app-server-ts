import { Router } from "express";
import usersRouter from "../components/users/users.router";
const apiRouter = Router();

apiRouter.use("/users", usersRouter);

/*
apiRouter.use("/decks", auth, decksRouter);
apiRouter.use("/flashcards", auth, flashcardsRouter);
apiRouter.use("/quiz", auth, quizRouter);
apiRouter.use("/images", auth, imagesRouter);
*/

// apiRouter.use("/shop", auth, shopRouter);

export default apiRouter;
