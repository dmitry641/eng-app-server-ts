import { getBuffer, getCsvData, shuffle } from ".";
import { file1, file3, utilTestCases } from "../test/testcases";

describe("Util: getBuffer function", () => {
  const correctPath = file1.pathToFile;
  const wrongPath = file3.pathToFile;

  function getBufferWithWrongPath() {
    getBuffer(wrongPath);
  }

  it("file doesn't exist; thrown error", async () => {
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
  it("Empty csvHeaders -> error", async () => {
    const tc = utilTestCases.case1;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    let errMsg;
    try {
      await getCsvData<CsvKeys>(buffer, tc.csvHeaders, []);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("CsvHeaders is empty");
  });

  it("Empty requiredProps -> error", async () => {
    const tc = utilTestCases.case1;
    const buffer = getBuffer(tc.pathToFile);
    const headers: string[] = ["1", "2", "3"];
    type CsvKeys = { [K in typeof headers[number]]: string }; // близко, но не совсем то что нужно
    let errMsg;
    try {
      await getCsvData<CsvKeys>(buffer, headers, []);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("RequiredProps is empty");
  });

  it("Not the same length -> error", async () => {
    const tc = utilTestCases.case1;
    const buffer = getBuffer(tc.pathToFile);
    const headers: string[] = ["1", "2", "3"];
    type CsvKeys = { [K in typeof headers[number]]: string }; // близко, но не совсем то что нужно
    let errMsg;
    try {
      await getCsvData<CsvKeys>(buffer, headers, [true]);
    } catch (error) {
      const err = error as Error;
      errMsg = err.message;
    }
    expect(errMsg).toBe("Headers and requiredProps should be the same length");
  });

  it("Empty file -> []", async () => {
    const tc = utilTestCases.case1;
    const buffer = getBuffer(tc.pathToFile);
    const headers: string[] = ["test"];
    type CsvKeys = { [K in typeof headers[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(buffer, headers, [true]);
    expect(result.length).toBe(0);
  });

  it.todo("Image file");
  it.todo("Non csv file");

  it("correct case 1", async () => {
    const tc = utilTestCases.case2;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(
      buffer,
      tc.csvHeaders,
      tc.requiredProps
    );
    expect(result).toEqual(tc.result);
  });
  it("correct case 2", async () => {
    const tc = utilTestCases.case3;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(
      buffer,
      tc.csvHeaders,
      tc.requiredProps
    );
    expect(result).toEqual(tc.result);
  });
  it("correct case 3", async () => {
    const tc = utilTestCases.case4;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(
      buffer,
      tc.csvHeaders,
      tc.requiredProps
    );
    expect(result).toEqual(tc.result);
  });

  it("Headers overflow in the file", async () => {
    const tc = utilTestCases.case5;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(
      buffer,
      tc.csvHeaders,
      tc.requiredProps
    );
    expect(result).toEqual(tc.result);
  });

  it("Lack of headers in the file -> []", async () => {
    const tc = utilTestCases.case6;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(
      buffer,
      tc.csvHeaders,
      tc.requiredProps
    );
    expect(result).toEqual(tc.result);
  });

  it("Wrong separator(not existing)", async () => {
    const tc = utilTestCases.case7;
    const buffer = getBuffer(tc.pathToFile);
    const result1 = await getCsvData(
      buffer,
      tc.csvHeaders,
      tc.requiredProps1,
      tc.separator
    );
    expect(result1).toEqual(tc.result1);
    const result2 = await getCsvData(
      buffer,
      tc.csvHeaders,
      tc.requiredProps2,
      tc.separator
    );
    expect(result2).toEqual(tc.result2);
  });
  it("Wrong separator(existing)", async () => {
    const tc = utilTestCases.case8;
    const buffer = getBuffer(tc.pathToFile);
    const result1 = await getCsvData(
      buffer,
      tc.csvHeaders,
      tc.requiredProps1,
      tc.separator
    );
    expect(result1).toEqual(tc.result1);
    const result2 = await getCsvData(
      buffer,
      tc.csvHeaders,
      tc.requiredProps2,
      tc.separator
    );
    expect(result2).toEqual(tc.result2);
  });

  it("Incorrect case", async () => {
    const tc = utilTestCases.case9;
    const buffer = getBuffer(tc.pathToFile);
    const result = await getCsvData(buffer, tc.csvHeaders, tc.requiredProps);
    expect(result.length).toBe(tc.result.length);
  });

  it("Lack of csv data, case 1", async () => {
    const tc = utilTestCases.case10;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(
      buffer,
      tc.csvHeaders,
      tc.requiredProps
    );
    expect(result).toEqual(tc.result);
  });
  it("Lack of csv data, case 2", async () => {
    const tc = utilTestCases.case11;
    const buffer = getBuffer(tc.pathToFile);
    type CsvKeys = { [K in typeof tc.csvHeaders[number]]: string }; // близко, но не совсем то что нужно
    const result = await getCsvData<CsvKeys>(
      buffer,
      tc.csvHeaders,
      tc.requiredProps
    );
    expect(result).toEqual(tc.result);
  });
});
