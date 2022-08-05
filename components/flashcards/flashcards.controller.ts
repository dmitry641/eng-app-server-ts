import { NextFunction, Request, Response } from "express";
import BadRequest from "../../exceptions/BadRequest";
import Unauthorized from "../../exceptions/Unauthorized";
import { UserCardsSettingsDTO } from "../users/user";
import { UCStatusType, UCType, UpdateType, UpdateTypeEnum } from "./const";
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
    const { userCardId } = req.params;
    if (!userCardId) throw new BadRequest();
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

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) throw new Unauthorized();
    const { type, value }: UpdateType = req.body;
    const ucclient = await userCardsManager.getUserCardsClient(req.user);
    let settings: UserCardsSettingsDTO;

    switch (type) {
      case UpdateTypeEnum.dynamicHighPriority:
        settings = await ucclient.updateHighPriority(value);
        break;
      case UpdateTypeEnum.showLearned:
        settings = await ucclient.updateShowLearned(value);
        break;
      case UpdateTypeEnum.shuffleDecks:
        settings = await ucclient.updateShuffle(value);
        break;
      case UpdateTypeEnum.frontSideFirst:
        settings = await ucclient.updateFrontSideFirst(value);
        break;
      case UpdateTypeEnum.randomSideFirst:
        settings = await ucclient.updateRandomSideFirst(value);
        break;
      default:
        throw new BadRequest();
    }

    return res.send(settings);
  } catch (error) {
    next(error);
  }
}
