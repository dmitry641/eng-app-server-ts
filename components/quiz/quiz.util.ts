import { AnyKeys } from "mongoose";
import path from "path";
import { getBuffer, getCsvData } from "../../utils";
import { IQuestion } from "./models/questions.model";
import { ITopic } from "./models/topics.model";
import { QuestionService, TopicService } from "./quiz.service";

export async function quizDBInitialize() {
  const topics = await TopicService.findTopics();
  const questions = await QuestionService.findQuestions();
  if (topics.length && questions.length) return;
  if (topics.length) await TopicService.dropTopics();
  if (questions.length) await QuestionService.dropQuestions();
  console.log("Quiz: Topics and questions collections are creating...");
  await createCollections({
    csvFileNames: ["esldiscussions", "iteslj"],
    pathToDir: path.resolve(__dirname, "quizdata"),
    csvHeaders: ["topicName", "question"],
  });
  console.log("Quiz: Topics and questions collections created.");
}

type CreateCollType = {
  csvFileNames: string[];
  pathToDir: string;
  csvHeaders: string[];
};
// esldissussion: line 5451, 5462, 8913 should be removed manually
async function createCollections({
  csvFileNames,
  pathToDir,
  csvHeaders,
}: CreateCollType) {
  type CsvKeys = { [K in typeof csvHeaders[number]]: string };

  let parsedData: {
    source: string;
    data: CsvKeys[];
  }[] = [];

  for (let fileName of csvFileNames) {
    const pathToFile = path.resolve(pathToDir, fileName + ".csv");
    const buffer = getBuffer(pathToFile);
    const data = await getCsvData<CsvKeys>(buffer, csvHeaders, "|");
    parsedData.push({ source: fileName, data });
  }

  for (let { source, data } of parsedData) {
    await createNewQuestion<CsvKeys>(source, data);
  }
}

// или так
// const quizCsvHeaders = ["topicName", "question"] as const;
// type QuizKeysType = { [K in typeof quizCsvHeaders[number]]: string };
// или так
// type QuizKeysType = {
//   topicName: ITopic["topicName"];
//   question: IQuestion["question"];
// };

// AnyKeys - костыль
// возможно стоит вернуться к варианту с "as const"
// и тогда и этого костыля не будет и дургих момемнтов с CsvKeys
async function createNewQuestion<T extends AnyKeys<ITopic & IQuestion>>(
  source: string,
  data: T[]
) {
  let uniqueTopics = new Set<string>(
    data.map((t) => {
      return t.topicName;
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
