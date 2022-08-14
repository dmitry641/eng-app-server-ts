import { Document, ObjectId } from "mongoose";

export type ObjId = ObjectId;

export type DocumentWithTimestamps = Document & {
  updatedAt: Date;
  createdAt: Date;
};
