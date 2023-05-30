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
        this.waitingList.push(new BotPlayer());
    }

    getAll(): Player[] {
        return this.waitingList;
    }

    remove(playerId: number): Player | undefined {
        let newWaitingList: Player[] = [];
        let playerRemoved: Player | undefined;
        this.waitingList.forEach((player: Player) => {
            if (player.id == playerId) {
                playerRemoved = player;
            } else {
                newWaitingList.push(player);
            }
        });
        this.waitingList = newWaitingList;
        return playerRemoved;
    }
}

export { WaitingListService };