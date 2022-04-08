import { Document, ObjectId } from "mongoose";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function shuffle<T>(array: Array<T>) {
  let m: number = array.length;
  let i: number;
  let t;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

export type DocumentWithTimestamps = Document & {
  updatedAt: Date;
  createdAt: Date;
};

export type ObjId = ObjectId;
