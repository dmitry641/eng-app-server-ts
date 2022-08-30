import { UserCardModel } from "../components/cards/models/userCards.model";
import { UserTopicModel } from "../components/quiz/models/userTopics.model";

const DAY_MS = 1000 * 3600 * 24;
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
  private daysCount: number = 7;
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
    const allLrndQstns = userTopics.map((ut) => ut.learnedQuestions).flat();
    const stats = calcStats(daysCount, allLrndQstns);
    return { moduleName: this.moduleName, stats };
  }
}
class FlashcardsModule implements Module {
  moduleName: AvailableModules = "flashcards";
  async getStats({ daysCount, userId }: GetStatsAttr): Promise<StatsByModule> {
    const userCards = await UserCardModel.find({ user: userId });
    const allHistory = userCards.map((uc) => uc.history).flat();
    const stats = calcStats(daysCount, allHistory);
    return { moduleName: this.moduleName, stats };
  }
}

type DayType = { date: number; count: number };
function initDays(daysCount: number): DayType[] {
  const today = new Date().setHours(10, 0, 0, 0);
  const days = [{ date: today, count: 0 }];
  for (let i = 1; i <= daysCount; i++) {
    let day = today - DAY_MS * i;
    days.push({ date: day, count: 0 });
  }
  return days;
}

function calcStats<T extends { date: number }>(
  daysCount: number,
  array: T[]
): Stats {
  const days: DayType[] = initDays(daysCount);
  const total = array.length;

  for (let elem of array) {
    let date = new Date(elem.date).setHours(10, 0, 0, 0);
    let day = days.find((d) => d.date === date);
    if (day) day.count += 1;
  }

  const today = days.shift()?.count || 0;
  const sum = days.reduce((sum, day) => sum + day.count, 0);
  const average = Math.floor(sum / daysCount);

  return { average, today, total };
}
