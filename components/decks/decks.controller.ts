import { NextFunction, Request, Response } from "express";
import BadRequest from "../../exceptions/BadRequest";
import Unauthorized from "../../exceptions/Unauthorized";
import { decksService } from "./decks.service";
import {
  AutoSyncType,
  DType,
  SyncDataType,
  UDPosType,
  UDType,
} from "./decks.util";

async function getUserDecks(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const userDecks = await decksService.getUserDecks(req.userId);
    return res.send(userDecks);
  } catch (error) {
    next(error);
  }
}
async function createUserDeck(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const file = req.file;
    if (!file) throw new BadRequest();
    if (file.mimetype != "text/csv" && !file.originalname.endsWith(".csv")) {
      throw new BadRequest("Mime type must be 'text/csv'");
    }
    const userDeck = await decksService.createUserDeck(req.userId, file);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}

async function enableUserDeck(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { userDeckId }: UDType = req.body;
    const userDeck = await decksService.enableUserDeck(req.userId, userDeckId);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}
async function deleteUserDeck(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { userDeckId } = req.params;
    if (!userDeckId) throw new BadRequest();
    const result = await decksService.deleteUserDeck(req.userId, userDeckId);
    return res.send(result);
  } catch (error) {
    next(error);
  }
}
async function moveUserDeck(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { userDeckId, position }: UDPosType = req.body;
    await decksService.moveUserDeck(req.userId, userDeckId, position);
    const userDecks = await decksService.getUserDecks(req.userId);
    return res.send(userDecks);
  } catch (error) {
    next(error);
  }
}
async function publishUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { userDeckId }: UDType = req.body;
    const userDeck = await decksService.publishUserDeck(req.userId, userDeckId);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}

async function getPublicDecks(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const decks = await decksService.getPublicDecks(req.userId);
    return res.send(decks);
  } catch (error) {
    next(error);
  }
}
async function addPublicDeck(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { deckId }: DType = req.body;
    const userDeck = await decksService.addPublicDeck(req.userId, deckId);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}

async function createDynamicUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) throw new Unauthorized();
    const userDeck = await decksService.createDynamicUserDeck(req.userId);
    const settings = await decksService.getDecksSettings(req.userId);
    return res.send({ userDeck, settings });
  } catch (error) {
    next(error);
  }
}
async function deleteDynamicUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) throw new Unauthorized();
    await decksService.deleteDynamicUserDeck(req.userId);
    const settings = await decksService.getDecksSettings(req.userId);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
async function syncDynamicUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) throw new Unauthorized();
    const userDeck = await decksService.syncDynamicUserDeck(req.userId);
    const settings = await decksService.getDecksSettings(req.userId);
    return res.send({ userDeck, settings });
  } catch (error) {
    next(error);
  }
}

async function getUserDecksSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) throw new Unauthorized();
    const settings = await decksService.getDecksSettings(req.userId);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
async function updateSyncData(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { type, link }: SyncDataType = req.body;
    const settings = await decksService.updateSyncData(req.userId, type, link);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
async function updateAutoSync(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { value }: AutoSyncType = req.body;
    const settings = await decksService.updateAutoSync(req.userId, value);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}

export const decksController = {
  getUserDecks,
  getUserDecksSettings,
  createUserDeck,
  enableUserDeck,
  deleteUserDeck,
  moveUserDeck,
  publishUserDeck,
  getPublicDecks,
  addPublicDeck,
  createDynamicUserDeck,
  deleteDynamicUserDeck,
  syncDynamicUserDeck,
  updateSyncData,
  updateAutoSync,
};
