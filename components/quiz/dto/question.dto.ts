import { IQuestion } from "../models/questions.model";

export class QuestionDto {
  readonly id: string;
  readonly question: string;
  readonly topicId: string;
  constructor(dbQuestion: IQuestion) {
    this.id = String(dbQuestion._id);
    this.question = dbQuestion.question;
    this.topicId = String(dbQuestion._id);
  }
}
