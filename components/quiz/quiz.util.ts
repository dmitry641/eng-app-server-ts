import path from "path";
import { getBuffer, getCsvData } from "../../utils";
import { QuestionService, TopicService } from "./quiz.service";

export const quizCsvHeaders = ["topicName", "text"] as const;
export type QuizKeysType = { [K in typeof quizCsvHeaders[number]]: string };
// или так
// type QuizKeysType = {
//   topicName: ITopic["topicName"];
//   text: IQuestion["text"];
// };

type CreateCollType = {
  csvFileNames: string[];
  pathToDir: string;
  csvHeaders: (keyof QuizKeysType)[] | readonly (keyof QuizKeysType)[];
};

export class QuizUtil {
  static async quizDBInitialize() {
    const topics = await TopicService.findTopics();
    const questions = await QuestionService.findQuestions();
    if (topics.length && questions.length) return;
    if (topics.length) await TopicService.dropTopics();
    if (questions.length) await QuestionService.dropQuestions();
    console.log("Quiz: Topics and questions collections are creating...");
    await this.createCollections({
      csvFileNames: ["esldiscussions", "iteslj"],
      pathToDir: path.resolve(__dirname, "quizdata"),
      csvHeaders: quizCsvHeaders,
    });
    console.log("Quiz: Topics and questions collections created.");
  }

  // esldissussion: line 5451, 5462, 8913 should be removed manually
  static async createCollections({
    csvFileNames,
    pathToDir,
    csvHeaders,
  }: CreateCollType) {
    let parsedData: {
      source: string;
      data: QuizKeysType[];
    }[] = [];

    for (let fileName of csvFileNames) {
      const pathToFile = path.resolve(pathToDir, fileName + ".csv");
      const buffer = getBuffer(pathToFile);
      const data = await getCsvData<QuizKeysType>(buffer, csvHeaders, "|");
      parsedData.push({ source: fileName, data });
    }

    for (let { source, data } of parsedData) {
      await this.createNewQuestion(source, data);
    }
  }

  static async createNewQuestion(source: string, data: QuizKeysType[]) {
    let uniqueTopics = new Set<string>(
      data.map((t) => {
        return t.topicName;
      })
    );

    for (let topicName of uniqueTopics) {
      const topic = await TopicService.createTopic({ topicName, source });
      let questions = data.filter((obj) => obj.topicName === topicName);
      for (let el of questions) {
        await QuestionService.createQuestion({
          topic: topic._id,
          text: el.text,
        });
      }
    }
  }
}
