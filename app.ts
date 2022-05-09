import dotenv from "dotenv";
import { globalDecksStore } from "./components/decks/deck";
import { globalCardsStore } from "./components/flashcards/cards";
import { globalQuizStore } from "./components/quiz/quiz";
import { QuizUtil } from "./components/quiz/quiz.util";
import { globalJobStore } from "./components/schedule";
import { connectToDB } from "./db";
import { deleteMe } from "./deleteme";
dotenv.config();

async function start() {
  try {
    console.log("Connecting to database...");
    await connectToDB();
    console.log("Connected to database.");
    await QuizUtil.quizDBInitialize();
    await globalQuizStore.init();
    await globalJobStore.init();
    await globalDecksStore.init();
    await globalCardsStore.init();

    await deleteMe();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
start();
