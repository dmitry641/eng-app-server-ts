import yup from "../../utils/yup.util";
import { UpdUserSettingsEnum } from "./users.util";

export const signUpSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .email("Email must be a valid")
    .required("Email is required"),
  password: yup
    .string()
    .min(5, "Password is too short")
    .required("Password is required"),
  reToken: yup.string().required("ReCaptcha is required"),
  darkMode: yup.boolean().required("DarkMode is required"),
});

export const signInSchema = yup.object({
  email: yup
    .string()
    .email("Email must be a valid")
    .required("Email is required"),
  password: yup.string().min(5, "Password is too short").required(),
  reToken: yup.string().required("ReCaptcha is required"),
});

export const updateSettingsSchema = yup.object({
  value: yup.boolean().required("Value is required"),
  type: yup.string().oneOf(Object.values(UpdUserSettingsEnum), "Wrong type"),
});
