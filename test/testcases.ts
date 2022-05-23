import { resolve } from "path";
import { IReversoResponse } from "../components/decks/sync";
import { QuizKeysType } from "../components/quiz/quiz.util";

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
  case10: {
    pathToFile: resolve(__dirname, "file3.csv"),

    separator: "|",
    description: "File3",
  },
  case11: {
    pathToFile: resolve(__dirname, "file4.csv"),

    separator: "|",
    description: "File4",
  },
};

export const quizTestData1: QuizKeysType[] = [
  {
    topicName: "Tax",
    text: "What would happen in your country if everyone stopped paying tax?",
  },
  {
    topicName: "Tax",
    text: "Do you know what taxes are spent on in your country?",
  },
  {
    topicName: "Tax",
    text: "Would you like to move to a country where there are no taxes?",
  },
  {
    topicName: "Tax",
    text: "Is tax an important issue at election time?",
  },
  { topicName: "Stress", text: "What is stress?" },
  { topicName: "Stress", text: "What causes stress?" },
  {
    topicName: "Stress",
    text: "How do you recognize stress in your life?",
  },
  {
    topicName: "Stress",
    text: "Have you been under stress recently?",
  },
  { topicName: "Stress", text: "How does stress affect you?" },
  {
    topicName: "Stress",
    text: "Do you have a kind of red warning flag that indicates too much stress?",
  },
];

export const decksTestCases = {
  case1: {
    pathToFile: resolve(__dirname, "file5.csv"),
    description: "Correct file",
    cardsCount: 10,
  },
  case2: {
    pathToFile: resolve(__dirname, "file6.csv"),
    description: "Incorrect file",
    cardsCount: 1,
  },
  case3: {
    pathToFile: resolve(__dirname, "file7.csv"),
    description: "Correct file",
    cardsCount: 30,
  },
};

export const rawCardsTestData1 = [
  {
    srcLang: "English",
    trgLang: "Russian",
    srcText: "aptitude",
    trgText: "способность",
    customId: "1",
  },
  {
    srcLang: "English",
    trgLang: "Russian",
    srcText: "vortex",
    trgText: "вихрь",
    customId: "2",
  },
];

export const reversoTestResponse: IReversoResponse = {
  numTotalResults: 3,
  numFilteredResults: 3,
  results: [
    {
      id: 1,
      srcLang: "English",
      srcText: "Test",
      trgLang: "Russian",
      trgText: "Тест",
    },
    {
      id: 2,
      srcLang: "English",
      srcText: "Book",
      trgLang: "Russian",
      trgText: "Книга",
    },
    {
      id: 3,
      srcLang: "English",
      srcText: "Pencil",
      trgLang: "Russian",
      trgText: "Ручка",
    },
  ],
};

const hour = 10;
const day = hour * 100;
const hardArray = [hour];
const mediumArray = [hour * 15, hour * 25];
const easyArray = [day, day * 3, day * 7, day * 10, day * 20];
export const testIntervalArray = { hardArray, mediumArray, easyArray };
