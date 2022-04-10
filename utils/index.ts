import csvParser from "csv-parser";
import { Document, ObjectId } from "mongoose";
import { Readable } from "stream";
import { existsSync, readFileSync } from "fs";

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

// Был вариант передавать ReadStream
// Но я решил сделать через buffer
export async function getCsvData<T>(
  buffer: Buffer,
  csvHeaders: string[],
  separator: string = ","
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const readStream = Readable.from(buffer.toString());
    const results: T[] = [];
    readStream
      .pipe(csvParser({ headers: csvHeaders, separator }))
      .on("data", (data: T) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

export function getBuffer(pathToFile: string): Buffer {
  const isFileExists = existsSync(pathToFile);
  if (!isFileExists) throw new Error(`${pathToFile} doesn't exists`);
  const buffer = readFileSync(pathToFile);
  return buffer;
}
