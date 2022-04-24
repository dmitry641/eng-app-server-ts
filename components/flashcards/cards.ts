export const cardsCsvHeaders = [
  "srcLang",
  "trgLang",
  "srcText",
  "trgText",
] as const;
export type CardsKeysType = { [K in typeof cardsCsvHeaders[number]]: string };
