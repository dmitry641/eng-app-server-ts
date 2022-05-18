import { globalDecksStore } from "./components/decks/deck";
import { userDecksManager } from "./components/decks/userDeck";
import { globalCardsStore } from "./components/flashcards/cards";
import { userCardsManager } from "./components/flashcards/userCards";
import { userQuizManager } from "./components/quiz/userQuiz";
import { globalUserStore } from "./components/users/user";
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

  const user = await globalUserStore.createUser({
    email: String(Math.random()),
    name: "123",
    password: "123",
  });
  console.log(user);
  console.log(br);

  const udclient = await userDecksManager.getUserDecksClient(user);
  const result = getBuffer(decksTestCases.case1.pathToFile);
  const userDeck = await udclient.createUserDeck({
    buffer: result,
    mimetype: "csv",
    originalname: String(Math.random()),
  });
  console.log(userDeck);
  console.log(br);

  const deck = globalDecksStore.getDeckById(userDeck.deckId);
  console.log(deck);
  console.log(br);

  const cards = globalCardsStore.getCardsByDeckId(deck.id);
  console.log(cards.length);
  console.log(cards[0]);
  console.log(br);

  const ucclient = await userCardsManager.getUserCardsClient(user);
  const userCards = await ucclient.getUserCards();
  console.log(userCards.length);
  console.log(userCards[0]);
  console.log(br);

  const uqclient = await userQuizManager.getUserQuizClient(user);
  const userTopic = await uqclient.initUserTopic();
  console.log(userTopic);
  console.log(br);

  const questions = await uqclient.getQuestions();
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
