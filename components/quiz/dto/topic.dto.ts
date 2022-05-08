import { ITopic } from "../models/topics.model";

export class TopicDto {
  readonly id: string;
  readonly topicName: string;
  readonly source: string;
  constructor(topic: ITopic) {
    this.id = String(topic._id);
    this.topicName = topic.topicName;
    this.source = topic.source;
  }
}
