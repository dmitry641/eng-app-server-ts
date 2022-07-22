import yup from "../../utils/yup.util";
import { DynamicSyncType, UserDeckPositionEnum } from "../users/users.util";

export const UDSchema = yup.object({
  userDeckId: yup.string().isObjectId("UserDeckId is required"),
});

export const UDPosSchema = yup.object({
  userDeckId: yup.string().isObjectId("UserDeckId is required"),
  position: yup
    .string()
    .oneOf(Object.values(UserDeckPositionEnum), "Wrong order"),
});

export const DSchema = yup.object({
  deckId: yup.string().isObjectId("UserDeckId is required"),
});

export const autoSyncSchema = yup.object({
  value: yup.boolean().required("Value is required"),
});

export const syncDataSchema = yup.object({
  link: yup.string().required("Link is required"),
  type: yup.string().oneOf(Object.values(DynamicSyncType), "Wrong type"),
});
