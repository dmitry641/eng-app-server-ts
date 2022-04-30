export enum DynamicSyncType {
  reverso = "reverso",
  google = "google",
}

export type DynamicSyncData = {
  email?: string;
  password?: string;
  accountName?: string;
};

export enum UserDeckPositionEnum {
  up = "up",
  down = "down",
}
