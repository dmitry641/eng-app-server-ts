import { Router } from "express";
import multer from "multer";
import validate from "../../middleware/validate";
import {
  addPublicDeckToUserDecks,
  createDynamicUserDeck,
  createUserDeck,
  deleteDynamicUserDeck,
  deleteUserDeck,
  enableUserDeck,
  getPublicDecks,
  getUserDecks,
  getUserDecksSettings,
  moveUserDeck,
  syncDynamicUserDeck,
  toggleUserDeckPublic,
  updateAutoSync,
  updateSyncData,
} from "./decks.controller";
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

decksRouter.get("/", getUserDecks);
decksRouter.get("/settings", getUserDecksSettings);
decksRouter.post("/", upload.single("csv"), createUserDeck);

decksRouter.post("/enable", validate(UDSchema), enableUserDeck);
decksRouter.delete("/delete", validate(UDSchema), deleteUserDeck);
decksRouter.post("/move", validate(UDPosSchema), moveUserDeck);
decksRouter.post("/toggle", validate(UDSchema), toggleUserDeckPublic);

decksRouter.get("/public", getPublicDecks);
decksRouter.post("/public", validate(DSchema), addPublicDeckToUserDecks);

decksRouter.post("/dynamic", createDynamicUserDeck);
decksRouter.delete("/dynamic", deleteDynamicUserDeck);
decksRouter.post("/dynamic/sync", syncDynamicUserDeck);
decksRouter.post(
  "/dynamic/update/auto",
  validate(autoSyncSchema),
  updateAutoSync
);
decksRouter.post(
  "/dynamic/update/data",
  validate(syncDataSchema),
  updateSyncData
);

export default decksRouter;
