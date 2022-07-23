import { Router } from "express";
import validate from "../../middleware/validate";
import {
  deleteUserCard,
  favoriteUserCard,
  getFavorites,
  getUserCards,
  getUserCardsSettings,
  learnUserCard,
  updateHighPriority,
  updateShowLearned,
  updateShuffle,
} from "./flashcards.controller";
import { UCSchema, UCStatusSchema, updateSchema } from "./flashcards.schema";
const flashcardsRouter = Router();

flashcardsRouter.get("/", getUserCards);
flashcardsRouter.get("/favorites", getFavorites);
flashcardsRouter.get("/settings", getUserCardsSettings);

flashcardsRouter.post("/", validate(UCStatusSchema), learnUserCard);
flashcardsRouter.delete("/", validate(UCSchema), deleteUserCard);
flashcardsRouter.post("/favorites", validate(UCSchema), favoriteUserCard);

flashcardsRouter.post(
  "/settings/highpriority",
  validate(updateSchema),
  updateHighPriority
);
flashcardsRouter.post(
  "/settings/shuffle",
  validate(updateSchema),
  updateShuffle
);
flashcardsRouter.post(
  "/settings/showlearned",
  validate(updateSchema),
  updateShowLearned
);

export default flashcardsRouter;
