import { CookieOptions } from "express";

export enum DynamicSyncType {
  reverso = "reverso",
  yandex = "yandex",
}

export enum UserDeckPositionEnum {
  up = "up",
  down = "down",
}

export const COOKIE_NAME: string = "engApp";
export const COOKIE_OPTIONS: CookieOptions = {
  maxAge: 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: Boolean(process.env.COOKIE_SECURE),
  sameSite: "lax", // FIXME: разобраться
};
