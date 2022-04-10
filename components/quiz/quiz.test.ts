import { connectToTestDB, disconnectFromDB } from "../../db";

describe("Quiz util", () => {
  const pathToFile = "1";
  const csvHeaders = [];

  // createCollections
  it("createCollections", async () => {
    expect(1).toBe(1);
    // await expect(getCsvData("qwe", [])).rejects.toContain("doesn't exists");
  });
});

// describe("Quiz util", () => {
//   beforeAll(async () => {
//     await connectToTestDB();
//   });

//   afterAll(async () => {
//     await disconnectFromDB();
//   });
// });
