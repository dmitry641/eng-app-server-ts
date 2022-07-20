import HttpException from "./HttpException";

class Unauthorized extends HttpException {
  constructor(msg: string = "Unauthorized") {
    super(401, msg);
  }
}

export default Unauthorized;
