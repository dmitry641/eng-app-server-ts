import { ObjId } from "../../utils/types";
import { User, UserCardsSettings } from "../users/user";
import { HistoryStatusEnum, IUserCard } from "./models/userCards.model";

class UserCardsClient {
  // private pool:UserCard[] = [];
  private userCards: UserCard[];
  // небольшое количество, чтобы при гетКардс(после синхронизации колоды) мы получили новые карты, а не старые
  private settings: UserCardsSettings;
  constructor(private user: User) {
    this.settings = user.settings.userCardsSettings;
  }
  deleteUserCard(userCardId: UserCardId) {
    // Нарушение все возможных паттернов......
    // const userCard = getUserCard(userCardId)
    // if userCard.deleted throw already deleted
    // await userCard.delete()
    // userDecksClient = globalUserDecksStore.get(this.user)
    // const userDeck = userDecksClient.getUserDeckById(userCard.userDeckId)
    // await userDeck.setCardsCount(userDeck.cardsCount - 1)
    // на фронте при 200, обновлять UserDeck
    //
  }
  favoriteUserCard(userCardId: UserCardId) {
    // искать не в пуле, так как фавориты в другом месте
  }
  getUserCards() {
    // отдать из пула
    // или заполнить пул и потом отдать из него
    /*
    1. Отдаём всё что есть в пуле, до тех пор, пока он не пустой
    2. Динамическая колода(при учёте highPriority)
    3. Из repeated по showAfter (в пул их пихаем)

    Как только получили N-карточек из динамической/случайной колоды
    Сразу добовляем их в UserCards в Pool
     
    */
  }
  getFavorites() {}
  learnUserCard(userCardId: UserCardId) {}
  private getUserCardFromPool() {}
  private getUserCardFromRepeated() {}
}

export type UserCardId = ObjId;
export class UserCard {
  readonly id: UserCardId;
  private _usercard: IUserCard;
  private _deleted: boolean;
  constructor(usercard: IUserCard) {
    this.id = usercard._id;
    this._usercard = usercard;
    this._deleted = usercard.deleted;
  }
  get deleted() {
    return this._deleted;
  }
  async makeLearned(status: HistoryStatusEnum) {
    switch (status) {
      case HistoryStatusEnum.easy:
        return this.easy();
      case HistoryStatusEnum.medium:
        return this.medium();
      case HistoryStatusEnum.hard:
        return this.hard();
      default:
        throw new Error("Invalid status");
    }
  }
  private async easy() {}
  private async medium() {}
  private async hard() {}
}
