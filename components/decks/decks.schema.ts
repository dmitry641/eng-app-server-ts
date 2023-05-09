import yup from "../../utils/yup.util";
import { UDPositionEnum } from "./decks.util";

export const UDSchema = yup.object({
  userDeckId: yup.string().isObjectId("UserDeckId is required"),
});

export const UDPosSchema = yup.object({
  userDeckId: yup.string().isObjectId("UserDeckId is required"),
  position: yup.string().oneOf(Object.values(UDPositionEnum), "Wrong position"),
});

export const DSchema = yup.object({
  deckId: yup.string().isObjectId("DeckId is required"),
});
