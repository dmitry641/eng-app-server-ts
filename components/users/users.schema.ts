import yup from "../../utils/yup.util";

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
  // passwordConfirmation: yup
  //   .string()
  //   .oneOf([yup.ref("password"), null], "Passwords must match")
  //   .required("Password confirmation is required"),
  // reToken: yup.string().required("ReCaptcha is required"),
});

export const signInSchema = yup.object({
  email: yup
    .string()
    .email("Email must be a valid")
    .required("Email is required"),
  password: yup.string().min(5, "Password is too short").required(),
  // reToken: yup.string().required("ReCaptcha is required"),
});
