import { resolve } from "path";
import { IReversoResponse } from "../components/decks/sync";
import { QuestionDTO, TopicDTO } from "../components/quiz/quiz";
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
