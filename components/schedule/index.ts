import schedule from "node-schedule";
import { randomIntFromInterval } from "../../utils";
import { ObjId } from "../../utils/types";
import { UserDecksService } from "../decks/services/userDecks.service";
import { userDecksManager } from "../decks/userDeck";
import { globalUserStore, User, UserId } from "../users/user";
import { UserJobTypesEnum } from "./types";

class JobStore {
  private initialized: boolean = false;
  userJobs: UserJobsManager;
  globalJobs: GlobalJobsManager;
  constructor() {
    this.userJobs = new UserJobsManager();
    this.globalJobs = new GlobalJobsManager();
  }
  async init() {
    if (this.initialized) throw new Error("JobStore is already initialized");
    await this.userJobs.init();
    await this.globalJobs.init();
    this.initialized = true;
  }
}

export class UserJobsManager {
  private userjobs = new Map<User, UserJobStore>();
  async init() {
    // спорный момент
    const dbDynUserDeck = await UserDecksService.findUserDecks({
      dynamic: true,
    });
    for (const dbDeck of dbDynUserDeck) {
      const user = await globalUserStore.getUser(String(dbDeck.user));
      this.createJob(user, UserJobTypesEnum.deckSync);
    }

    // find notification(not implemented)
  }
  private createJob(
    user: User,
    type: UserJobTypesEnum,
    options?: UserJobCreationOptions
  ) {
    const userJob = UserJobFactory.create(type, options);
    const rule = userJob.getRule(options);
    const cb = userJob.getCallback({ userId: user.id, options });

    const job = schedule.scheduleJob(rule, cb);

    userJob.setJob(job);
    const userJobStore = this.getUserJobStore(user);
    userJobStore.appendJob(userJob);
  }
  cancelJob(user: User, userJobId: UserJobId) {
    const userJobStore = this.getUserJobStore(user);
    const userJob = userJobStore.getJob(userJobId);
    if (!userJob) return; // Userjob not found
    userJob.cancel();
    userJobStore.deleteJob(userJob);
  }
  updateJob(
    user: User,
    userJobId: UserJobId,
    type: UserJobTypesEnum,
    options?: UserJobCreationOptions
  ) {
    this.cancelJob(user, userJobId);
    this.createJob(user, type, options);
  }
  private getUserJobStore(user: User): UserJobStore {
    let userJobs = this.userjobs.get(user);
    if (userJobs) return userJobs;
    const userJobStore = new UserJobStore();
    this.userjobs.set(user, userJobStore);
    return userJobStore;
  }
}
class GlobalJobsManager {
  async init() {}
  private createJob() {}
  cancelJob() {}
  updateJob() {
    this.cancelJob();
    this.createJob();
  }
}

type UserJobId = ObjId | "deckSyncJob";
type UserJobCreationOptions = {
  detail?: { id: ObjId };
};

class UserJobStore {
  private userjobs: IUserJob[] = [];
  appendJob(userjob: IUserJob) {
    this.userjobs.push(userjob);
  }
  getJob(userJobId: UserJobId) {
    return this.userjobs.find((j) => j.id === userJobId);
  }
  deleteJob(userJob: IUserJob) {
    this.userjobs = this.userjobs.filter((j) => j.id !== userJob.id);
  }
}

class UserJobFactory {
  static create(
    type: UserJobTypesEnum,
    options?: UserJobCreationOptions
  ): IUserJob {
    switch (type) {
      case UserJobTypesEnum.deckSync:
        return new UserDeckSyncJob("deckSyncJob");
      case UserJobTypesEnum.notification:
        const id = options?.detail?.id;
        if (!id) throw new Error("ID is undefined");
        return new UserNotificationJob(id);
      default:
        throw new Error("not implemented");
    }
  }
}

interface IUserJob {
  readonly id: UserJobId;
  job?: schedule.Job;
  setJob(job: schedule.Job): void;
  cancel(): void;
  getRule(options?: UserJobCreationOptions): schedule.RecurrenceSpecDateRange;
  getCallback(obj: GetCallbackAttr): schedule.JobCallback;
}
type GetCallbackAttr = {
  userId: UserId;
  options?: UserJobCreationOptions;
};

export class UserDeckSyncJob implements IUserJob {
  job?: schedule.Job | undefined;
  constructor(readonly id: UserJobId) {}
  setJob(job: schedule.Job): void {
    this.job = job;
  }
  cancel(): void {
    this.job?.cancel();
  }
  getRule(): schedule.RecurrenceSpecDateRange {
    const start = Date.now() + 100;
    const rand = randomIntFromInterval(1, 59);
    return { start, rule: `${rand} */3 * * *` };
    // `N */3 * * *`(3hr); `*/3 * * * *`(3min)
  }
  getCallback(obj: GetCallbackAttr): schedule.JobCallback {
    return async () => {
      try {
        const user = await globalUserStore.getUser(obj.userId);
        const autoSync = user.settings.userDecksSettings.dynamicAutoSync;
        if (!autoSync) throw new Error("DynamicAutoSync is false");
        const udclient = await userDecksManager.getUserDecksClient(user);
        await udclient.syncDynamicUserDeck();
      } catch (error) {
        this.cancel();
      }
    };
  }
}

class UserNotificationJob implements IUserJob {
  job?: schedule.Job | undefined;
  constructor(readonly id: UserJobId) {}
  setJob(job: schedule.Job): void {
    this.job = job;
  }
  cancel(): void {
    throw new Error("Method not implemented.");
  }
  getRule(): schedule.RecurrenceSpecDateRange {
    throw new Error("Method not implemented.");
  }
  getCallback(): schedule.JobCallback {
    throw new Error("Method not implemented.");
  }
}
export const globalJobStore = new JobStore();
