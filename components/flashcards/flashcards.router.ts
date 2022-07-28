import { Router } from "express";
import validate from "../../middleware/validate";
import {
  deleteUserCard,
  favoriteUserCard,
  getFavorites,
  getUserCards,
  getUserCardsSettings,
  learnUserCard,
  updateSettings,
} from "./flashcards.controller";
import { UCSchema, UCStatusSchema, updateSchema } from "./flashcards.schema";
const flashcardsRouter = Router();

flashcardsRouter.get("/", getUserCards);
flashcardsRouter.post("/", validate(UCStatusSchema), learnUserCard);
flashcardsRouter.delete("/:userCardId", deleteUserCard);

flashcardsRouter.get("/favorites", getFavorites);
flashcardsRouter.post("/favorites", validate(UCSchema), favoriteUserCard);

flashcardsRouter.get("/settings", getUserCardsSettings);
flashcardsRouter.post("/settings", validate(updateSchema), updateSettings);

export default flashcardsRouter;
