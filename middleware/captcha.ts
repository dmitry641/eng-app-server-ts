import { NextFunction, Request, Response } from "express";
import BadRequest from "../exceptions/BadRequest";

async function captcha(req: Request, res: Response, next: NextFunction) {
  try {
    next();
    // const token = req.body.reToken;
    // const response = await axios.post(
    //   `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    // );
    // if (response?.data?.success) return next();
    // throw new Error();
  } catch (error) {
    next(new BadRequest("ReCaptcha validation error"));
  }
}
export default captcha;
