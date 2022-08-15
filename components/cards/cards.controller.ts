import { NextFunction, Request, Response } from "express";
import BadRequest from "../../exceptions/BadRequest";
import Unauthorized from "../../exceptions/Unauthorized";
import { cardsService } from "./cards.service";
import { UCStatusType, UCType, UpdateType } from "./cards.util";

async function getUserCards(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const userCards = await cardsService.getUserCards(req.userId);
    return res.send(userCards);
  } catch (error) {
    next(error);
  }
}
async function getFavorites(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const favorites = await cardsService.getFavorites(req.userId);
    return res.send(favorites);
  } catch (error) {
    next(error);
  }
}
async function getCardsSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) throw new Unauthorized();
    const settings = await cardsService.getCardsSettings(req.userId);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}

async function deleteUserCard(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { userCardId } = req.params;
    if (!userCardId) throw new BadRequest();
    const object = await cardsService.deleteUserCard(req.userId, userCardId);
    return res.send(object);
  } catch (error) {
    next(error);
  }
}
async function favoriteUserCard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { userCardId }: UCType = req.body;
    const userCard = await cardsService.favoriteUserCard(
      req.userId,
      userCardId
    );
    return res.send(userCard);
  } catch (error) {
    next(error);
  }
}
async function learnUserCard(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const { userCardId, status }: UCStatusType = req.body;
    const object = await cardsService.learnUserCard(
      req.userId,
      userCardId,
      status
    );
    return res.send(object);
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new Unauthorized();
    const update: UpdateType = req.body;
    const settings = await cardsService.updateSettings(req.userId, update);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}

export const cardsController = {
  getUserCards,
  getFavorites,
  getCardsSettings,
  deleteUserCard,
  favoriteUserCard,
  learnUserCard,
  updateSettings,
};
