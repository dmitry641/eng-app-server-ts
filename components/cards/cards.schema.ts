import yup from "../../utils/yup.util";
import { UpdateTypeEnum } from "./cards.util";

export const UCSchema = yup.object({
  userCardId: yup.string().isObjectId("UserCardId is required"),
});

export const UCStatusSchema = yup.object({
  userCardId: yup.string().isObjectId("UserCardId is required"),
  status: yup.boolean().required("Status is required"),
});

export const updateSchema = yup.object({
  type: yup.string().oneOf(Object.values(UpdateTypeEnum), "Wrong type"),
  value: yup.boolean().required("Value is required"),
});
