import { ObjectId } from "bson";
import * as YUP from "yup";

declare module "yup" {
  interface StringSchema {
    isObjectId(message: string): StringSchema;
  }
}

const yup = YUP;

yup.addMethod<YUP.StringSchema>(yup.string, "isObjectId", function (message) {
  return this.test("isObjectId", message, function (value) {
    if (!value) return false;
    let result = ObjectId.isValid(value);
    if (!result) return false;
    return true;
  });
});

export default yup;
