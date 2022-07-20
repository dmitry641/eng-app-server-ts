import HttpException from "./HttpException";

class NotFound extends HttpException {
  constructor(msg: string = "Not Found") {
    super(404, msg);
  }
}

export default NotFound;
