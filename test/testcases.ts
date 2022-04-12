import { resolve } from "path";
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
    question:
      "What would happen in your country if everyone stopped paying tax?",
  },
  {
    topicName: "Tax",
    question: "Do you know what taxes are spent on in your country?",
  },
  {
    topicName: "Tax",
    question: "Would you like to move to a country where there are no taxes?",
  },
  {
    topicName: "Tax",
    question: "Is tax an important issue at election time?",
  },
  { topicName: "Stress", question: "What is stress?" },
  { topicName: "Stress", question: "What causes stress?" },
  {
    topicName: "Stress",
    question: "How do you recognize stress in your life?",
  },
  {
    topicName: "Stress",
    question: "Have you been under stress recently?",
  },
  { topicName: "Stress", question: "How does stress affect you?" },
  {
    topicName: "Stress",
    question:
      "Do you have a kind of red warning flag that indicates too much stress?",
  },
];