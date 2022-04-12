import dotenv from "dotenv";
import { QuizUtil } from "./components/quiz/quiz.util";
import { connectToDB } from "./db";
dotenv.config();

async function start() {
  try {
    console.log("Connecting to database...");
    await connectToDB();
    console.log("Connected to database.");

    await QuizUtil.quizDBInitialize();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
start();
