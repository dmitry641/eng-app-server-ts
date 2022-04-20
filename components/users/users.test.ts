import { userStore } from "./user";

describe("UserStore tests:", () => {
  beforeAll(async () => {
    // await connectToDB();
  });

  describe("Create user", () => {
    // it.todo("...");
    it("with valid data", () => {
      expect(userStore.createUser()).toBe(1);
    });
  });
});
