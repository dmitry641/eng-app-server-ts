import { testStore } from "./delme";
import { other } from "./delme2";

class Test {
  readonly qwe = 5;
  private asd = "xxx";
  toJSON() {
    return this.asd;
  }
  toString() {
    return "something";
  }
}

export async function deleteMe() {
  console.log("delete me");
  other.q = 1;

  const cat = new Cat();
  cat.walk();

  testStore.array.push("main");
  // try {
  //   const test = new ClassA();
  // } catch (error) {
  //   // console.log(error);
  // }
  cat.walk();
  console.log(testStore.array);

  const dog = new Dog();
  dog.walk();
  other.method();
}

class ClassA {
  constructor() {
    throw new Error("test");
  }
}

/*

  const walkingAnimals: IWalk[] = [new Cat(), new Dog()];

  const dog = walkingAnimals.find((a) => a instanceof Dog);
  // dog.

  const persons: Person[] = [new Employee(), new Customer()];
  const employee = persons.find((p) => p instanceof Employee);
  // employee.

*/

class Person {
  method() {}
}
class Employee extends Person {
  otherMethod() {}
}
class Customer extends Person {
  anotherMethod() {}
}

interface IWalk {
  walk: () => void;
}
class Cat implements IWalk {
  walk() {
    console.log("cat walks");
    testStore.array.push("cat class");
  }
  meow() {}
}
class Dog implements IWalk {
  walk() {
    console.log("dog walks");
  }
  woof() {}
}
