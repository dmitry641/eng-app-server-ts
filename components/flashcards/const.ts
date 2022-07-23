import { HistoryStatusEnum } from "./models/userCards.model";
import { UserCardId } from "./userCards";

const hour = 1000 * 60 * 60;
const day = hour * 24;
const hardArray = [hour];
const mediumArray = [hour * 5, hour * 10];
const easyArray = [day, day * 3, day * 7, day * 20, day * 50, day * 300];

export const intervalArray = {
  hardArray,
  mediumArray,
  easyArray,
};

export type UCType = { userCardId: UserCardId };
export type UCStatusType = UCType & { status: HistoryStatusEnum };
export type updateType = { value: boolean };
