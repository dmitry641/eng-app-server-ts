import { resolve } from "path";
import {
  QuestionDTO,
  QuizKeysType,
  TopicDTO,
} from "../components/quiz/quiz.util";

// { [K: string]: { pathToFile: string; csvHeaders: string[] } }
// export const quizTestCases = new Map<number, T>()
export const testHour = () => 25;

export const file1 = {
  pathToFile: resolve(__dirname, "testcases.ts"),
  description: "Text-based format",
};
export const file2 = {
  pathToFile: resolve(__dirname, "image.png"),
  description: "Non text-based format",
};
export const file3 = {
  pathToFile: "qwerty",
  description: "Wrong path to file",
};

export const utilTestCases = {
  case1: {
    pathToFile: resolve(__dirname, "utils", "file1.csv"),
    csvHeaders: [],
    description: "File 1, empty",
  },
  case2: {
    pathToFile: resolve(__dirname, "utils", "file2.csv"),
    csvHeaders: ["test"],
    requiredProps: [true],
    description: "File 2, correct case 1",
    result: [{ test: "good" }],
  },
  case3: {
    pathToFile: resolve(__dirname, "utils", "file3.csv"),
    csvHeaders: ["test"],
    requiredProps: [false],
    description: "File 3, correct case 2",
    result: [
      { test: "" },
      { test: "good" },
      { test: "" },
      { test: "" },
      { test: "good" },
    ],
  },
  case4: {
    pathToFile: resolve(__dirname, "utils", "file4.csv"),
    csvHeaders: ["test1", "test2"],
    requiredProps: [true, false],
    description: "File 4, correct case 3",
    result: [
      { test1: "good", test2: "" },
      { test1: "good", test2: "good" },
    ],
  },
  case5: {
    pathToFile: resolve(__dirname, "utils", "file5.csv"),
    csvHeaders: ["test"],
    requiredProps: [true],
    description: "File 5, overflow",
    result: [{ test: "good" }, { test: "good" }],
  },
  case6: {
    pathToFile: resolve(__dirname, "utils", "file6.csv"),
    csvHeaders: ["test1", "test2", "test3"],
    requiredProps: [true, true, true],
    description: "File 6, lack of headers",
    result: [],
  },
  case7: {
    pathToFile: resolve(__dirname, "utils", "file7.csv"),
    csvHeaders: ["test1", "test2"],
    requiredProps1: [false, false],
    requiredProps2: [false, true],
    separator: "^",
    description: "File 7, wrong separator(not existing)",
    result1: [
      {
        test1: "good,good,good",
        test2: "",
      },
      {
        test1: ",,,",
        test2: "",
      },
      {
        test1: "bad,bad",
        test2: "",
      },
    ],
    result2: [],
  },
  case8: {
    pathToFile: resolve(__dirname, "utils", "file8.csv"),
    csvHeaders: ["test1", "test2"],
    requiredProps1: [false, false],
    requiredProps2: [false, true],
    separator: "#",
    description: "File 8, wrong separator(existing)",
    result1: [
      {
        test1: "good",
        test2: "good,good",
      },
      {
        test1: ",",
        test2: ",",
      },
      {
        test1: "bad,bad",
        test2: "",
      },
    ],
    result2: [
      {
        test1: "good",
        test2: "good,good",
      },
      {
        test1: ",",
        test2: ",",
      },
    ],
  },
  case9: {
    pathToFile: resolve(__dirname, "utils", "file9.csv"),
    csvHeaders: ["test1", "test2"],
    requiredProps: [true, true],
    description: "File 9, incorrect case",
    result: [{}, {}, {}, {}, {}, {}, {}, {}],
  },
  case10: {
    pathToFile: resolve(__dirname, "utils", "file10.csv"),
    csvHeaders: ["h1", "h2", "h3", "h4"],
    requiredProps: [true, false, true, false],
    description: "File 10, lack of csv data, case 1",
    result: [
      { h1: "good", h2: "", h3: "good", h4: "" },
      { h1: "good", h2: "", h3: "good", h4: "" },
    ],
  },
  case11: {
    pathToFile: resolve(__dirname, "utils", "file11.csv"),
    csvHeaders: ["h1", "h2", "h3"],
    requiredProps: [false, false, false],
    description: "File 10, lack of csv data, case 2",
    result: [
      { h1: "", h2: "good", h3: "" },
      { h1: "", h2: "", h3: "" },
      { h1: "good", h2: "", h3: "good" },
    ],
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
    pathToFile: resolve(__dirname, "decks", "file1.csv"),
    description: "Correct file",
    cardsCount: 10,
  },
  case2: {
    pathToFile: resolve(__dirname, "decks", "file2.csv"),
    description: "Incorrect file",
    cardsCount: 7,
  },
  case3: {
    pathToFile: resolve(__dirname, "decks", "file3.csv"),
    description: "Correct file",
    cardsCount: 30,
  },
  case4: {
    pathToFile: resolve(__dirname, "decks", "file4.csv"),
    description: "Correct file",
    cardsCount: 10,
  },
  case5: {
    pathToFile: resolve(__dirname, "decks", "file5.csv"),
    description: "Correct file",
    cardsCount: 5,
  },
};

export const rawCardsTestData1 = [
  {
    frontPrimary: "aptitude",
    frontSecondary: "",
    backPrimary: "способность",
    backSecondary: "",
  },
  {
    frontPrimary: "vortex",
    frontSecondary: "",
    backPrimary: "вихрь",
    backSecondary: "",
  },
];

export const testTopics: TopicDTO[] = [
  {
    id: "627fbfe46ceca39333bb97be",
    topicName: "Animals & Pets",
    source: "iteslj",
  },
  {
    id: "627fbfe06ceca39333bb7524",
    topicName: "Protests",
    source: "esldiscussions",
  },
  {
    id: "627fbfd96ceca39333bb4026",
    topicName: "Finland",
    source: "esldiscussions",
  },
  {
    id: "627fbfe26ceca39333bb87ae",
    topicName: "Voting",
    source: "esldiscussions",
  },
  {
    id: "627fbfdb6ceca39333bb5064",
    topicName: "Information",
    source: "esldiscussions",
  },
];

export const testQuestions: QuestionDTO[] = [
  {
    id: "627fbfe46ceca39333bb97c0",
    text: "Do you have a pet?",
    topicId: "627fbfe46ceca39333bb97be",
  },
  {
    id: "627fbfe46ceca39333bb97c2",
    text: "How old is it?",
    topicId: "627fbfe46ceca39333bb97be",
  },
  {
    id: "627fbfe46ceca39333bb97c4",
    text: "Where did you get it from?",
    topicId: "627fbfe46ceca39333bb97be",
  },
  {
    id: "627fbfe46ceca39333bb97c6",
    text: "Who takes care of it?",
    topicId: "627fbfe46ceca39333bb97be",
  },
  {
    id: "627fbfe46ceca39333bb97c8",
    text: "What does it look like (color, breed, etc.)?",
    topicId: "627fbfe46ceca39333bb97be",
  },
  {
    id: "627fbfe06ceca39333bb7526",
    text: "What do you think about when you hear the word protests?",
    topicId: "627fbfe06ceca39333bb7524",
  },
  {
    id: "627fbfe06ceca39333bb7528",
    text: "Is it good or bad to protest?",
    topicId: "627fbfe06ceca39333bb7524",
  },
  {
    id: "627fbfe06ceca39333bb752a",
    text: "What protests are happening around the world right now? Do you agree with them?",
    topicId: "627fbfe06ceca39333bb7524",
  },
  {
    id: "627fbfe06ceca39333bb752c",
    text: "How should police deal with protestors?",
    topicId: "627fbfe06ceca39333bb7524",
  },
  {
    id: "627fbfe06ceca39333bb752e",
    text: "How have protests changed the history of different countries?",
    topicId: "627fbfe06ceca39333bb7524",
  },
  {
    id: "627fbfd96ceca39333bb4028",
    text: "What images spring to mind when you hear the country Finland?",
    topicId: "627fbfd96ceca39333bb4026",
  },
  {
    id: "627fbfd96ceca39333bb402a",
    text: "What are the good things and bad things about Finland?",
    topicId: "627fbfd96ceca39333bb4026",
  },
  {
    id: "627fbfd96ceca39333bb402c",
    text: "What is Finland famous for?",
    topicId: "627fbfd96ceca39333bb4026",
  },
  {
    id: "627fbfd96ceca39333bb402e",
    text: "What do you know about Finnish history?",
    topicId: "627fbfd96ceca39333bb4026",
  },
  {
    id: "627fbfd96ceca39333bb4030",
    text: "What images of Finland do you have that are beautiful and high-tech?",
    topicId: "627fbfd96ceca39333bb4026",
  },
  {
    id: "627fbfe26ceca39333bb87b0",
    text: "What comes to mind when you hear the word ‘voting’?",
    topicId: "627fbfe26ceca39333bb87ae",
  },
  {
    id: "627fbfe26ceca39333bb87b2",
    text: "Do you think voting is over-rated?",
    topicId: "627fbfe26ceca39333bb87ae",
  },
  {
    id: "627fbfe26ceca39333bb87b4",
    text: "Why is being able to vote so important?",
    topicId: "627fbfe26ceca39333bb87ae",
  },
  {
    id: "627fbfe26ceca39333bb87b6",
    text: "Are you happy you’ll get good service from the people you vote for?",
    topicId: "627fbfe26ceca39333bb87ae",
  },
  {
    id: "627fbfe26ceca39333bb87b8",
    text: "Do you like looking at election results on TV?",
    topicId: "627fbfe26ceca39333bb87ae",
  },
  {
    id: "627fbfdb6ceca39333bb5066",
    text: "What springs to mind when you hear the word ‘information’?",
    topicId: "627fbfdb6ceca39333bb5064",
  },
  {
    id: "627fbfdb6ceca39333bb5068",
    text: "Are you happy with the amount of information in your head?",
    topicId: "627fbfdb6ceca39333bb5064",
  },
  {
    id: "627fbfdb6ceca39333bb506a",
    text: "How much useless information do you think you’ve learned?",
    topicId: "627fbfdb6ceca39333bb5064",
  },
  {
    id: "627fbfdb6ceca39333bb506c",
    text: "Do you have more information than your grandparents?",
    topicId: "627fbfdb6ceca39333bb5064",
  },
  {
    id: "627fbfdb6ceca39333bb506e",
    text: "Is it important to know a lot of information in today’s world?",
    topicId: "627fbfdb6ceca39333bb5064",
  },
];
