import { NextFunction, Request, Response } from "express";
import Unauthorized from "../../exceptions/Unauthorized";
import { UCStatusType, UCType, updateType } from "./const";
import { userCardsManager } from "./userCards";

export async function getUserCards(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const userCards = await ucclient.getUserCards();
    return res.send(userCards);
  } catch (error) {
    next(error);
  }
}
export async function getFavorites(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const favorites = ucclient.getFavorites();
    return res.send(favorites);
  } catch (error) {
    next(error);
  }
}
export async function getUserCardsSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const settings = ucclient.getUserCardsSettings();
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}

export async function deleteUserCard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userCardId }: UCType = req.body;
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const result = await ucclient.deleteUserCard(userCardId);
    return res.send(result);
  } catch (error) {
    next(error);
  }
}
export async function favoriteUserCard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userCardId }: UCType = req.body;
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const userCard = await ucclient.favoriteUserCard(userCardId);
    return res.send(userCard);
  } catch (error) {
    next(error);
  }
}
export async function learnUserCard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { userCardId, status }: UCStatusType = req.body;
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const userCard = await ucclient.learnUserCard(userCardId, status);
    return res.send(userCard);
  } catch (error) {
    next(error);
  }
}

export async function updateHighPriority(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { value }: updateType = req.body;
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const settings = await ucclient.updateHighPriority(value);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
export async function updateShuffle(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { value }: updateType = req.body;
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const settings = await ucclient.updateShuffle(value);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
export async function updateShowLearned(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { value }: updateType = req.body;
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    const settings = await ucclient.updateShowLearned(value);
    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
