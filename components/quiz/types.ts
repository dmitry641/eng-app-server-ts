import { QuestionId, TopicId } from "./quiz";
import { UserTopicId } from "./userQuiz";

export type UTType = { userTopicId: UserTopicId };
export type TType = { topicId: TopicId };
export type QType = { questionId: QuestionId };

export type UnsplashImage = {
  id: string;
  width: number;
  height: number;
  description: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
    small_s3: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    links: {
      html: string;
    };
  };
};

export class ImageDto {
  readonly id: string;
  readonly original: string;
  readonly thumbnail: string;
  readonly name: string;
  readonly userLink: string;
  readonly description: string;
  constructor(img: UnsplashImage) {
    this.id = img.id;
    this.original = img.urls.regular;
    this.thumbnail = img.urls.thumb;
    this.name = img.user.name;
    this.userLink = img.user.links.html;
    this.description = img.description;
  }
}

export type UnsplashResponse = {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
};
