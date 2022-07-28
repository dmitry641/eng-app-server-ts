import { NextFunction, Request, Response } from "express";
import { AnySchema, ValidationError } from "yup";
import BadRequest from "../exceptions/BadRequest";

function validate(schema: AnySchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      await schema.validate(body);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        const msg = error.errors.join(", ");
        next(new BadRequest(msg));
      } else {
        next(new BadRequest("Unexpected error"));
      }
    }
  };
}

export default validate;
