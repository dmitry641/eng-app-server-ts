import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

export async function connectToDB() {
  return mongoose.connect(process.env.DB_URI as string);
}

export async function connectToTestDB() {
  return mongoose.connect(process.env.DB_URI_TEST as string);
}

export async function disconnectFromDB() {
  return mongoose.connection.close();
}
