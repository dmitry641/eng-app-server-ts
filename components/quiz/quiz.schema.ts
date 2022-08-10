import yup from "../../utils/yup.util";

export const UTSchema = yup.object({
  userTopicId: yup.string().isObjectId("UserTopicId is required"),
});

export const TSchema = yup.object({
  topicId: yup.string().isObjectId("TopicId is required"),
});

export const QSchema = yup.object({
  questionId: yup.string().isObjectId("QuestionId is required"),
});
