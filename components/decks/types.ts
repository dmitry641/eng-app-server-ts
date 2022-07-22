import { DynamicSyncType, UserDeckPositionEnum } from "../users/users.util";
import { DeckId } from "./deck";
import { UserDeckId } from "./userDeck";

export type DType = { deckId: DeckId };
export type UDType = { userDeckId: UserDeckId };
export type UDPosType = UDType & { position: UserDeckPositionEnum };
export type SyncDataType = { type: DynamicSyncType; link: string };
export type AutoSyncType = { value: boolean };
