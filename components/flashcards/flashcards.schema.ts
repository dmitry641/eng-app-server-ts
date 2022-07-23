import yup from "../../utils/yup.util";
import { HistoryStatusEnum } from "./models/userCards.model";

export const UCSchema = yup.object({
  userCardId: yup.string().isObjectId("UserCardId is required"),
});

export const UCStatusSchema = yup.object({
  userCardId: yup.string().isObjectId("UserCardId is required"),
  status: yup.string().oneOf(Object.values(HistoryStatusEnum), "Wrong order"),
});

export const updateSchema = yup.object({
  value: yup.boolean().required("Value is required"),
});
