export const SYNC_TIMEOUT_LIMIT = 120000;
export const SYNC_ATTEMPTS_COUNT_LIMIT = 3;

export class SyncClient {
  constructor() {
    // UserDecksClient ?
  }
  async syncHandler(): Promise<boolean> {
    // в Скедул инит, мы поместим юзера
    // и потом внутри, два варианта:
    // либо через этот синк клиент (предпочтительнее)
    // либо через юзер дек клиент

    // rawCards = ...
    // ГлобалКардс.что-то(rawCards, deck.id)
    // dynamicDeck.setCardsCount(...)
    return true;
  }
}
