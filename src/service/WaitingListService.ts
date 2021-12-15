import BotPlayer from "../logic/BotPlayer";
import Player from "../logic/Player";

class WaitingListService {
    waitingList: Player[] = [];

    constructor() {
        this.waitingList.push(new BotPlayer());
    }

    add(player: Player): void {
        this.waitingList.push(player);
    }

    getFirst(): Player {
        return this.waitingList.shift()!; // Exclamation says I´m sure this is not undefined
    }

    getLength(): number {
        return this.waitingList.length;
    }

    reset(): void {
        this.waitingList.length = 0;
    }

    getAll(): Player[] {
        return this.waitingList;
    }
}

export { WaitingListService };