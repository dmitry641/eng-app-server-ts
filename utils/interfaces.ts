import { Request } from "express";
import { User } from "../components/users/user";

export interface RequestWithUser extends Request {
  user?: User;
  sessionId?: string;
}
