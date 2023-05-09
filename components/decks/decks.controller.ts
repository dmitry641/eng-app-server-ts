import { NextFunction, Request, Response } from "express";
import BadRequest from "../../exceptions/BadRequest";
import Unauthorized from "../../exceptions/Unauthorized";
import { decksService } from "./decks.service";
import { DType, UDPosType, UDType } from "./decks.util";

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
    const userDeck = await decksService.deleteUserDeck(req.userId, userDeckId);
    return res.send(userDeck);
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

export const decksController = {
  getUserDecks,
  createUserDeck,
  enableUserDeck,
  deleteUserDeck,
  moveUserDeck,
  publishUserDeck,
  getPublicDecks,
  addPublicDeck,
};
