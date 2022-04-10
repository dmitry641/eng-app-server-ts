import { readFileSync } from "fs";
import { getBuffer, getCsvData } from ".";
import { quizTestCases } from "../test/testcases";

describe("Util: getBuffer function", () => {
  const wrongPath = quizTestCases.case1.pathToFile;
  const correctPath = quizTestCases.case2.pathToFile;

  function getBufferWithWrongPath() {
    getBuffer(wrongPath);
  }

  it("file doest exist; thrown error", async () => {
    expect(getBufferWithWrongPath).toThrowError(`${wrongPath} doesn't exists`);
  });
  it("file exists; result is buffer", async () => {
    const result = getBuffer(correctPath);
    expect(Buffer.isBuffer(result)).toBe(true);
  });
});

describe("Util: getCsvData function", () => {
  it("correct buffer, headers amount, separator", async () => {
    const tc = quizTestCases.case3;
    const lines = readFileSync(tc.pathToFile, { encoding: "utf-8" }).split(
      "\n"
    ).length;
    const buffer = getBuffer(tc.pathToFile);
    const result = await getCsvData<{}>(buffer, tc.csvHeaders, "|");
    expect(result.length).toBe(lines);
    for (let obj of result) {
      expect(Object.keys(obj)).toEqual(tc.csvHeaders);
    }
  });
  it.todo("mime type/csv check");
  it.todo("broken csv files check");
  it.todo("headers, separator, result");
  it.todo("не соответствие количества хедеров и колонок из файла");
  it.todo("не соответствие сепаратора");
});
