import dotenv from "dotenv";
import { globalDecksStore } from "./components/decks/deck";
import { globalCardsStore } from "./components/flashcards/cards";
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
    await globalJobStore.init();
    await globalDecksStore.init();
    await globalCardsStore.init();

    await deleteMe();

    await QuizUtil.quizDBInitialize();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
start();
