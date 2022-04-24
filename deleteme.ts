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
  const qqq = new Test();
  console.log(qqq);

  const q = JSON.stringify(qqq);
  console.log(q);
}
