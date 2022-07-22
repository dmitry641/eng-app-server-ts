import { NextFunction, Request, Response } from "express";
import BadRequest from "../../exceptions/BadRequest";
import Unauthorized from "../../exceptions/Unauthorized";
import { AutoSyncType, DType, SyncDataType, UDPosType, UDType } from "./types";
import { userDecksManager } from "./userDeck";

export async function getUserDecks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const userDecks = udclient.getUserDecks();
    return res.send(userDecks);
  } catch (error) {
    next(error);
  }
}
export async function getUserDecksSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const settings = udclient.getUserDecksSettings();
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
export async function createUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const file = req.file;
    if (!file) throw new BadRequest();
    if (file.mimetype != "text/csv" && !file.originalname.endsWith(".csv")) {
      throw new BadRequest("Mime type must be 'text/csv'");
    }
    const userDeck = await udclient.createUserDeck(file);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}

export async function enableUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userDeckId }: UDType = req.body;
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const userDeck = await udclient.enableUserDeck(userDeckId);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}
export async function deleteUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userDeckId }: UDType = req.body;
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const userDeck = await udclient.deleteUserDeck(userDeckId);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}
export async function moveUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userDeckId, position }: UDPosType = req.body;
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const userDeck = await udclient.moveUserDeck(userDeckId, position);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}
export async function toggleUserDeckPublic(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userDeckId }: UDType = req.body;
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const deck = await udclient.toggleUserDeckPublic(userDeckId);
    return res.send(deck);
  } catch (error) {
    next(error);
  }
}

export async function getPublicDecks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const decks = udclient.getPublicDecks();
    return res.send(decks);
  } catch (error) {
    next(error);
  }
}
export async function addPublicDeckToUserDecks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { deckId }: DType = req.body;
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const userDeck = await udclient.addPublicDeckToUserDecks(deckId);
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}

export async function createDynamicUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const userDeck = await udclient.createDynamicUserDeck();
    return res.send(userDeck);
  } catch (error) {
    next(error);
  }
}
export async function deleteDynamicUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const settings = await udclient.deleteDynamicUserDeck();
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
export async function syncDynamicUserDeck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const { settings, userDeck } = await udclient.syncDynamicUserDeck();
    return res.send({ userDeck, settings });
  } catch (error) {
    next(error);
  }
}
export async function updateSyncData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { type, link }: SyncDataType = req.body;
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const settings = udclient.updateSyncData(type, link);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
export async function updateAutoSync(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { value }: AutoSyncType = req.body;
    const udclient = await userDecksManager.getUserDecksClient(req.user);
    const settings = await udclient.updateAutoSync(value);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}