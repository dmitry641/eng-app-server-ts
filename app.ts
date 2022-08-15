import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { QuizDB } from "./components/quiz/quiz.service";
import { globalJobStore } from "./components/schedule";
import { connectToDB } from "./db";
import { deleteMe } from "./deleteme";
import NotFound from "./exceptions/NotFound";
import errorMiddleware from "./middleware/error";
import apiRouter from "./routes";
dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "common"));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);
app.use(express.urlencoded({ extended: false }));
app.use("/api", apiRouter);

app.use((req, res, next: NextFunction) => {
  next(new NotFound());
});
app.use(errorMiddleware);

async function start() {
  try {
    console.log("Connecting to database...");
    await connectToDB();
    console.log("Connected to database.");
    await QuizDB.saturate();
    await globalJobStore.init();

    await deleteMe();
    app.listen(PORT, () =>
      console.log(`Server is running at localhost:${PORT}`)
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
start();
