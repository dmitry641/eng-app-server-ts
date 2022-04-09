import dotenv from "dotenv";
import { quizDBInitialize } from "./components/quiz/quiz.util";
import { connectToDB } from "./db";
dotenv.config();

async function start() {
  try {
    await connectToDB();
    await quizDBInitialize();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
start();
