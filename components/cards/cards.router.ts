import { Router } from "express";
import validate from "../../middleware/validate";
import { cardsController as cc } from "./cards.controller";
import { UCSchema, UCStatusSchema, updateSchema } from "./cards.schema";
const flashcardsRouter = Router();

flashcardsRouter.get("/", cc.getUserCards);
flashcardsRouter.post("/", validate(UCStatusSchema), cc.learnUserCard);
flashcardsRouter.delete("/:userCardId", cc.deleteUserCard);

flashcardsRouter.get("/favorites", cc.getFavorites);
flashcardsRouter.post("/favorites", validate(UCSchema), cc.favoriteUserCard);

flashcardsRouter.get("/settings", cc.getCardsSettings);
flashcardsRouter.post("/settings", validate(updateSchema), cc.updateSettings);

export default flashcardsRouter;
