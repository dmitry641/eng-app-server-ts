import Cryptr from "cryptr";
import csvParser from "csv-parser";
import { existsSync, readFileSync } from "fs";
import { Readable } from "stream";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  let m: number = newArray.length;
  let i: number;
  let t;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = newArray[m];
    newArray[m] = newArray[i];
    newArray[i] = t;
  }

  return newArray;
}

// Был вариант передавать параметром ReadStream
// Но я решил сделать через buffer
type MyType = { [key: string]: string };
export async function getCsvData<T extends MyType>(
  buffer: Buffer,
  csvHeaders: (keyof T)[] | readonly (keyof T)[],
  requiredProps: boolean[],
  separator: string = ","
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (!csvHeaders.length) {
      return reject(new Error("CsvHeaders is empty")); // спорный момент
    }
    if (!requiredProps.length) {
      return reject(new Error("RequiredProps is empty")); // спорный момент
    }
    if (requiredProps.length !== csvHeaders.length) {
      return reject(
        new Error("Headers and requiredProps should be the same length")
      ); // спорный момент
    }
    const headers = csvHeaders as string[];
    const readStream = Readable.from(buffer.toString());
    const results: T[] = [];

    readStream
      .pipe(csvParser({ headers, separator }))
      .on("data", (data: T) => {
        let obj: MyType = {};
        headers.forEach((el) => {
          obj[el] = "";
        });
        const entries = Object.entries(data).slice(0, requiredProps.length);
        if (entries.length === 0) return;
        const values: boolean[] = entries.map((el) => Boolean(el[1]));

        for (let i = 0; i < requiredProps.length; i++) {
          const left: boolean = requiredProps[i];
          const right: boolean = values[i];
          if (left) {
            if (left !== right) return;
          }
        }

        let result: T = { ...obj, ...Object.fromEntries(entries) } as T; // спорный момент
        results.push(result);
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

export const cryptr = new Cryptr(process.env.SECRET || "secret");
