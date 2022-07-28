import { Router } from "express";
import multer from "multer";
import validate from "../../middleware/validate";
import { decksController as dc } from "./decks.controller";
import {
  autoSyncSchema,
  DSchema,
  syncDataSchema,
  UDPosSchema,
  UDSchema,
} from "./decks.schema";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const decksRouter = Router();

decksRouter.get("/", dc.getUserDecks);
decksRouter.get("/settings", dc.getUserDecksSettings);
decksRouter.post("/", upload.single("csv"), dc.createUserDeck);

decksRouter.post("/enable", validate(UDSchema), dc.enableUserDeck);
decksRouter.delete("/delete/:userDeckId", dc.deleteUserDeck);
decksRouter.post("/move", validate(UDPosSchema), dc.moveUserDeck);
decksRouter.post("/toggle", validate(UDSchema), dc.toggleUserDeckPublic);

decksRouter.get("/public", dc.getPublicDecks);
decksRouter.post("/public", validate(DSchema), dc.addPublicDeckToUserDecks);

decksRouter.post("/dynamic", dc.createDynamicUserDeck);
decksRouter.delete("/dynamic", dc.deleteDynamicUserDeck);
decksRouter.post("/dynamic/sync", dc.syncDynamicUserDeck);
decksRouter.post(
  "/dynamic/update/auto",
  validate(autoSyncSchema),
  dc.updateAutoSync
);
decksRouter.post(
  "/dynamic/update/data",
  validate(syncDataSchema),
  dc.updateSyncData
);

export default decksRouter;
