import schedule from "node-schedule";
import { ObjId } from "../../utils/types";
import { User } from "../users/user";

class JobStore {
  userJobs: UserJobsManager;
  globalJobs: GlobalJobsManager;
  constructor() {
    this.userJobs = new UserJobsManager();
    this.globalJobs = new GlobalJobsManager();
  }
  async init() {
    await this.userJobs.init();
    await this.globalJobs.init();
  }
}
export const globalJobStore = new JobStore();

class UserJobsManager {
  private userjobs = new Map<User, UserJobStore>();
  async init() {
    // find dynamic userdecks
    // find notification(not implemented)
  }
  createJob(
    user: User,
    type: UserJobTypesEnum,
    options?: UserJobCreationOptions
  ) {
    const userJob = UserJobFactory.create(type, options);
    const rule = userJob.getRule(options);
    const cb = userJob.getCallback(); // { detail, user: this._user }

    const job = schedule.scheduleJob(rule, cb);

    userJob.setJob(job);
    const userJobStore = this.getUserJobStore(user);
    userJobStore.appendJob(userJob);
  }
  cancelJob(user: User, userJobId: UserJobId) {}
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
  createJob() {}
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
export enum UserJobTypesEnum {
  deckSync = "deckSync",
  notification = "notification",
}

class UserJobStore {
  private userjobs: IUserJob[] = [];
  appendJob(userjob: IUserJob) {
    this.userjobs.push(userjob);
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
  readonly job?: schedule.Job;
  setJob(job: schedule.Job): void;
  cancel(): void;
  getRule(options?: UserJobCreationOptions): schedule.RecurrenceSpecDateRange;
  getCallback(): schedule.JobCallback;
}

class UserDeckSyncJob implements IUserJob {
  readonly job?: schedule.Job | undefined;
  constructor(readonly id: UserJobId) {}
  setJob(job: schedule.Job): void {
    throw new Error("Method not implemented.");
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

class UserNotificationJob implements IUserJob {
  readonly job?: schedule.Job | undefined;
  constructor(readonly id: UserJobId) {}
  setJob(job: schedule.Job): void {
    throw new Error("Method not implemented.");
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
