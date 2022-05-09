import { IQuestion } from "../models/questions.model";

export class QuestionDto {
  readonly id: string;
  readonly text: string;
  readonly topicId: string;
  constructor(dbQuestion: IQuestion) {
    this.id = String(dbQuestion._id);
    this.text = dbQuestion.text;
    this.topicId = String(dbQuestion._id);
  }
}
