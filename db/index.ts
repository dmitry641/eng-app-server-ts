import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

export async function connectToDB() {
  console.log("Connecting to database...");
  await mongoose.connect(process.env.DB_URI as string);
  console.log("Connected to database.");
}

export async function disconnectFromDB() {
  return mongoose.connection.close();
}
