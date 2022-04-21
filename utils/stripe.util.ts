import { IUser } from "../components/users/models/users.model";

type StripeCreateUserDto = {
  email: IUser["email"];
  name: IUser["name"];
};
type StripeUser = {
  id: string;
};
export class StripeUtil {
  static async createUser({
    email,
    name,
  }: StripeCreateUserDto): Promise<StripeUser> {
    // const user = await stripe.customers.create({ email, name });
    return { id: "12345" };
  }
}
