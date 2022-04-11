import { resolve } from "path";

// { [K: string]: { pathToFile: string; csvHeaders: string[] } }
// export const quizTestCases = new Map<number, T>()

export const quizTestCases = {
  case1: {
    pathToFile: "qwerty",
    csvHeaders: [],
    description: "Wrong path to file; empty headers",
  },
  case2: {
    pathToFile: resolve(__dirname, "file1.csv"),
    csvHeaders: [],
    description: "Correct path to file; empty headers",
  },
  case3: {
    pathToFile: resolve(__dirname, "file1.csv"),
    csvHeaders: ["header1", "header2"],
    separator: "|",
    description: "Correct path to file, headers amount",
  },
  case4: {
    pathToFile: resolve(__dirname, "testcases.ts"),
    csvHeaders: [],
    description: "Text-based format",
  },
  case5: {
    pathToFile: resolve(__dirname, "image.png"),
    csvHeaders: [],
    description: "Non text-based format",
  },
  case6: {
    pathToFile: resolve(__dirname, "file1.csv"),
    csvHeaders: ["1", "2", "3", "4", "5"],
    separator: "|",
    description: "Correct path; excess headers amount",
  },
  case7: {
    pathToFile: resolve(__dirname, "file1.csv"),
    csvHeaders: ["1"],
    separator: "|",
    description: "Correct path; lack of headers",
  },
  case8: {
    pathToFile: resolve(__dirname, "file1.csv"),
    csvHeaders: ["header1", "header2"],
    separator: "^",
    description: "Correct path, headers; wrong separator(not existing)",
  },
  case9: {
    pathToFile: resolve(__dirname, "file2.csv"),
    csvHeaders: ["header1", "header2"],
    separator: "#",
    description: "Correct path, headers; wrong separator(existing)",
  },
};
