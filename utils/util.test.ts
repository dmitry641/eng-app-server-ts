import { readFileSync } from "fs";
import { getBuffer, getCsvData, shuffle } from ".";
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

describe("Util: shuffle function", () => {
  let numbersArray = [1, 2, 3, 4, 5];
  let stringsArray = ["a", "bb", "ccc", "dddd"];
  let mixedArray = ["a", 1, {}, true];

  it("length", () => {
    const shuffled = shuffle(numbersArray);
    expect(shuffled.length).toBe(numbersArray.length);
  });
  it("sort", () => {
    const shuffledNumbers = shuffle(numbersArray);
    const shuffledStrings = shuffle(stringsArray);
    const shuffledMixed = shuffle(mixedArray);
    expect(shuffledNumbers.sort()).toEqual(numbersArray.sort());
    expect(shuffledStrings.sort()).toEqual(stringsArray.sort());
    expect(shuffledMixed.sort()).toEqual(mixedArray.sort());
  });
  it("immutability", () => {
    const jsonBefore = JSON.stringify(numbersArray);
    shuffle(numbersArray);
    const jsonAfter = JSON.stringify(numbersArray);
    expect(jsonBefore).toBe(jsonAfter);
  });
});

describe("Util: getCsvData function", () => {
  it("correct buffer, headers amount, separator", async () => {
    const tc = quizTestCases.case3;
    const lines = readFileSync(tc.pathToFile, { encoding: "utf-8" }).split(
      "\n"
    ).length;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(
      buffer,
      tc.csvHeaders,
      tc.separator
    );
    expect(result.length).toBe(lines);
    for (let obj of result) {
      expect(Object.keys(obj)).toEqual(tc.csvHeaders);
    }
  });

  it.todo("Text-based format");
  // it("text-based format -> error?", () => {
  //   const tc = quizTestCases.case4;
  //   const buffer = getBuffer(tc.pathToFile);
  //   expect(getCsvData(buffer, tc.csvHeaders)).rejects.toMatch("???");
  // });
  it.todo("Non text-based format");
  // it("non text-based format -> error?", () => {
  //   const tc = quizTestCases.case5;
  //   const buffer = getBuffer(tc.pathToFile);
  //   expect(getCsvData(buffer, tc.csvHeaders)).rejects.toMatch("???");
  // });

  it("correct buffer; empty headers -> thrown error", () => {
    const tc = quizTestCases.case2;
    const buffer = getBuffer(tc.pathToFile);
    expect(getCsvData(buffer, tc.csvHeaders)).rejects.toMatch(
      "csvHeaders is empty"
    );
  });
  it("correct buffer; excess headers -> []", async () => {
    const tc = quizTestCases.case6;
    const buffer = getBuffer(tc.pathToFile);
    const result = await getCsvData(buffer, tc.csvHeaders, tc.separator);
    expect(result).toEqual([]);
  });
  it("correct buffer; lack of headers -> []", async () => {
    const tc = quizTestCases.case7;
    const buffer = getBuffer(tc.pathToFile);
    const result = await getCsvData(buffer, tc.csvHeaders, tc.separator);
    expect(result).toEqual([]);
  });
  it("correct buffer, headers amount; wrong separator(not existing) -> []", async () => {
    const tc = quizTestCases.case8;
    const buffer = getBuffer(tc.pathToFile);
    const result = await getCsvData(buffer, tc.csvHeaders, tc.separator);
    expect(result).toEqual([]);
  });
  it("correct buffer, headers amount; wrong separator(existing) -> []", async () => {
    const tc = quizTestCases.case9;
    let lines = readFileSync(tc.pathToFile, { encoding: "utf-8" }).split(
      "\n"
    ).length;
    lines--; // minus one broken line
    const buffer = getBuffer(tc.pathToFile);
    const result = await getCsvData<{}>(buffer, tc.csvHeaders, tc.separator);
    expect(result.length).toBe(lines);
    for (let obj of result) {
      expect(Object.keys(obj)).toEqual(tc.csvHeaders);
    }
  });
});
