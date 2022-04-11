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

// Был вариант передавать параметром ReadStream
// Но я решил сделать через buffer
// А еще с Т проблемка, не получилось сделать динамический тип
// const headers = ["qwe", "asd"] as const;
// type CsvKeys = { [K in typeof headers[number]]: string };
// <T1 extends Array<string>, T2 extends {[K in typeof T1[number]]: string}>
export async function getCsvData<T>(
  buffer: Buffer,
  csvHeaders: string[],
  separator: string = ","
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (!csvHeaders.length) return reject("csvHeaders is empty"); // возможно это лишнее
    const readStream = Readable.from(buffer.toString());
    const results: T[] = [];
    const strHeaders = JSON.stringify(csvHeaders);
    readStream
      .pipe(csvParser({ headers: csvHeaders, separator }))
      .on("data", (data: T) => {
        // возможно это лишнее
        if (JSON.stringify(Object.keys(data)) === strHeaders) {
          results.push(data);
        }
      })
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
