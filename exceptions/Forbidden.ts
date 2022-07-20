import HttpException from "./HttpException";

class Forbidden extends HttpException {
  constructor(msg: string = "Forbidden") {
    super(403, msg);
  }
}

export default Forbidden;
