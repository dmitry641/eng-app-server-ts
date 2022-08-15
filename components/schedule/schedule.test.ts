import schedule from "node-schedule";
import { globalJobStore, UserDeckSyncJob, UserJobsManager } from ".";
import { connectToTestDB, disconnectFromDB } from "../../db";
import { DecksService, decksService } from "../decks/decks.service";
import { UserJobTypesEnum } from "../decks/decks.util";
import { userService } from "../users/users.service";

describe("UserJobsManager", () => {
  let userId: string;
  let userjobsmanager = new UserJobsManager();

  beforeAll(async () => {
    await connectToTestDB();
    const user = await userService.createUser({
      email: String(Math.random()) + "@email.com",
      name: "123",
      password: "123",
    });
    userId = user.id;
  });

  it("updateJob", async () => {
    const spySchedule = jest
      .spyOn(schedule, "scheduleJob")
      .mockImplementationOnce(() => null as unknown as schedule.Job);
    userjobsmanager.updateJob(userId, "deckSyncJob", UserJobTypesEnum.deckSync);
    expect(spySchedule).toBeCalled();
    userjobsmanager.cancelJob(userId, "deckSyncJob");
  });

  it("UserDeckSyncJob: getRule", () => {
    const udsj = new UserDeckSyncJob("deckSyncJob");
    const now = Date.now();
    const tommorow = new Date().setHours(0, 0, 0) + 1000 * 60 * 60 * 24;
    const isMatchFn = (n: number): boolean => n >= now && n <= tommorow;
    for (let i = 0; i < 100; i++) {
      const rule = udsj.getRule();
      const start = rule.start;
      const isInt = Number.isInteger(start);
      expect(isInt).toBe(true);
      const match = isMatchFn(start as number);
      expect(match).toBe(true);

      // regexp пройтись по rule.rule
    }
  });

  it("UserDeckSyncJob: getCallback", async () => {
    const udsj = new UserDeckSyncJob("deckSyncJob");
    const cb = udsj.getCallback({ userId });

    const spyCancel = jest.spyOn(udsj, "cancel");
    const fn = async () => cb(new Date());
    await fn();
    expect(spyCancel).toBeCalledTimes(1);

    await decksService.updateAutoSync(userId, true);
    globalJobStore.userJobs.cancelJob(userId, "deckSyncJob");
    const spySync = jest.spyOn(DecksService.prototype, "syncDynamicUserDeck");
    // @ts-ignore
    spySync.mockImplementation(async () => {
      throw new Error();
    });

    await fn();
    expect(spySync).toBeCalled();
    expect(spyCancel).toBeCalledTimes(2);
  });

  afterAll(async () => {
    await disconnectFromDB();
  });
});
