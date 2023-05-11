import { SchemaTimestampsConfig } from "mongoose";
import { UserCardModel } from "../components/cards/models/userCards.model";
import { UserTopicModel } from "../components/quiz/models/userTopics.model";
import { LearnedQuestion } from "../components/quiz/quiz.util";

const DAY_MS = 1000 * 3600 * 24;
export const DEFAULT_DAYS_COUNT = 7;
export type AvailableModules = "quiz" | "flashcards";
interface StatsByModule {
  moduleName: AvailableModules;
  stats: Stats;
}
interface Stats {
  today: number;
  average: number;
  total: number;
}

export class Statistics {
  private modules: AvailableModules[] = ["quiz", "flashcards"];
  private daysCount: number = DEFAULT_DAYS_COUNT || 1;
  private userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }
  setDaysCount(c: number) {
    this.daysCount = c;
  }
  setModules(mdl: AvailableModules[]): void;
  setModules(mdl: AvailableModules): void;
  setModules(mdl: AvailableModules | AvailableModules[]): void {
    if (Array.isArray(mdl)) {
      this.modules = mdl;
    } else {
      this.modules = [mdl];
    }
  }
  async getResult(): Promise<StatsByModule[]> {
    const results: StatsByModule[] = [];

    for (let moduleName of this.modules) {
      const module = ModuleFactory.create(moduleName);
      const stats = await module.getStats({
        daysCount: this.daysCount,
        userId: this.userId,
      });
      results.push(stats);
    }

    return results;
  }
}

class ModuleFactory {
  static create(moduleName: AvailableModules) {
    switch (moduleName) {
      case "quiz":
        return new QuizModule();
      case "flashcards":
        return new FlashcardsModule();
      default:
        throw new Error("module doest exist");
    }
  }
}
interface Module {
  moduleName: AvailableModules;
  getStats: ({ daysCount, userId }: GetStatsAttr) => Promise<StatsByModule>;
}
interface GetStatsAttr {
  userId: string;
  daysCount: number;
}

class QuizModule implements Module {
  moduleName: AvailableModules = "quiz";
  async getStats({ daysCount, userId }: GetStatsAttr): Promise<StatsByModule> {
    const userTopics = await UserTopicModel.find({ user: userId });
    const allLrndQstns: LearnedQuestion[] = userTopics
      .map((ut) => ut.learnedQuestions)
      .flat();

    const stats = calcStats(daysCount, allLrndQstns);
    return { moduleName: this.moduleName, stats };
  }
}
class FlashcardsModule implements Module {
  moduleName: AvailableModules = "flashcards";
  async getStats({ daysCount, userId }: GetStatsAttr): Promise<StatsByModule> {
    const userCards = await UserCardModel.find({
      user: userId,
      deleted: false,
    });
    const stats = calcStats(daysCount, userCards);
    return { moduleName: this.moduleName, stats };
  }
}

function calcStats<
  T extends { updatedAt?: SchemaTimestampsConfig["updatedAt"] }
>(daysCount: number, array: T[]): Stats {
  const todayDate = new Date(new Date().setUTCHours(0, 0, 0, 0));
  const boundary = todayDate.getTime() - (daysCount - 1) * DAY_MS;

  let todayCount = 0;
  let filteredCount = 0;

  array.forEach((elem) => {
    if (elem.updatedAt) {
      const updatedAt = new Date(elem.updatedAt as string);
      if (todayDate.toDateString() === updatedAt.toDateString()) todayCount++;
      if (updatedAt.getTime() > boundary) filteredCount++;
    }
  });

  const average = Math.floor(filteredCount / daysCount) || 0;
  return { today: todayCount, total: array.length, average };
}
