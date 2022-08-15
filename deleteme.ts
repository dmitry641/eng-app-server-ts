import { cardsService } from "./components/cards/cards.service";
import { decksService } from "./components/decks/decks.service";
import { quizService } from "./components/quiz/quiz.service";
import { userService } from "./components/users/users.service";
import { decksTestCases } from "./test/testcases";
import { getBuffer } from "./utils";

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
  const br = "-".repeat(25);

  const user = await userService.createUser({
    email: String(Math.random()),
    name: "123",
    password: "123",
  });
  console.log(user);
  console.log(br);

  const result = getBuffer(decksTestCases.case1.pathToFile);
  const userDeck = await decksService.createUserDeck(user.id, {
    buffer: result,
    mimetype: "csv",
    originalname: String(Math.random()),
  });
  console.log(userDeck);
  console.log(br);

  const deck = await decksService.getDeckById(userDeck.deck.id);
  console.log(deck);
  console.log(br);

  const cards = await cardsService.getCardsByDeckId(deck.id);
  console.log(cards.length);
  console.log(cards[0]);
  console.log(br);

  const userCards = await cardsService.getUserCards(user.id);
  console.log(userCards.length);
  console.log(userCards[0]);
  console.log(br);

  const userTopic = await quizService.initUserTopic(user.id);
  console.log(userTopic);
  console.log(br);

  const questions = await quizService.getQuestions(user.id);
  console.log(questions);
  console.log(br);
}

class ClassA {
  constructor() {
    throw new Error("test");
  }
}

/*

  // try {
  //   const test = new ClassA();
  // } catch (error) {
  //   // console.log(error);
  // }

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
  }
  meow() {}
}
class Dog implements IWalk {
  walk() {
    console.log("dog walks");
  }
  woof() {}
}
