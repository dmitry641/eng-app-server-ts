import HttpException from "./HttpException";

class BadRequest extends HttpException {
  constructor(msg: string = "Bad Request") {
    super(400, msg);
  }
}

export default BadRequest;
