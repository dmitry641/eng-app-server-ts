import { resolve } from "path";

// { [K: string]: { pathToFile: string; csvHeaders: string[] } }
// export const quizTestCases = new Map<number, T>()

export const quizTestCases = {
  case1: {
    pathToFile: "qwerty",
    csvHeaders: [],
    description: "Wrong path to file, empty headers",
  },
  case2: {
    pathToFile: resolve(__dirname, "file1.csv"),
    csvHeaders: [],
    description: "Correct path to file, empty headers",
  },
  case3: {
    pathToFile: resolve(__dirname, "file1.csv"),
    csvHeaders: ["header1", "header2"],
    description: "Correct path to file, correct headers amount",
  },
};
