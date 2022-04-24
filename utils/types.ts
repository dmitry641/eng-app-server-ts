import { Document, ObjectId } from "mongoose";

export type ObjId = ObjectId;

export type DocumentWithTimestamps = Document & {
  updatedAt: Date;
  createdAt: Date;
};

export type UploadedFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};
