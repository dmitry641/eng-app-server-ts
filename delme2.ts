import { testStore } from "./delme";

class Other {
  q = 123;
  constructor(str: string) {
    testStore.array.push(str);
  }
  method() {
    testStore.array.push(String(this.q));
    console.log(testStore.array);
  }
}

export const other = new Other("other");
