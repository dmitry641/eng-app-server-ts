import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { QuestionService, TopicService } from "./quiz.service";

const pathToData = path.resolve(__dirname, "quizdata");
const dataFileNames = ["esldiscussions", "iteslj"];
const csvHeaders = ["topicName", "question"] as const;

type ParsedCSVData = {
  [K in typeof csvHeaders[number]]: string;
};

export async function quizDBInitialize() {
  const topics = await TopicService.findTopics();
  const questions = await QuestionService.findQuestions();
  if (topics.length && questions.length) return;
  if (topics.length) await TopicService.dropTopics();
  if (questions.length) await QuestionService.dropQuestions();
  console.log("Quiz: Topics and questions collections are creating...");
  await createCollections();
  console.log("Quiz: Topics and questions collections created.");
}

async function createCollections() {
  // esldissussion: line 5451, 5462, 8913 should be removed manually
  let promises = dataFileNames.map(async (fileName) => {
    let data = await getCsvData(fileName + ".csv");
    return { source: fileName, data };
  });
  let csvData = await Promise.all(promises);

  for (let elem of csvData) {
    await createNewQuestion(elem);
  }
}

type CreateNewQuestionAttr = {
  source: string;
  data: ParsedCSVData[];
};
async function createNewQuestion({ source, data }: CreateNewQuestionAttr) {
  let uniqueTopics = new Set(
    data.map((qwe) => {
      return qwe.topicName;
    })
  );

  for (let topicName of uniqueTopics) {
    const topic = await TopicService.createTopic({ topicName, source });
    let questions = data.filter((obj) => obj.topicName === topicName);
    if (questions.length == 1) return;
    for (let el of questions) {
      await QuestionService.createQuestion({
        topic: topic._id,
        question: el.question,
      });
    }
  }
}

async function getCsvData(filename: string): Promise<ParsedCSVData[]> {
  return new Promise((resolve, reject) => {
    const results: ParsedCSVData[] = [];
    const pathToFile = path.resolve(pathToData, filename);
    const isFileExists = fs.existsSync(pathToFile);
    if (!isFileExists) reject(`${pathToFile} doesn't exists`);

    fs.createReadStream(pathToFile)
      .pipe(csv({ headers: csvHeaders, separator: "|" }))
      .on("data", (data: ParsedCSVData) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}
