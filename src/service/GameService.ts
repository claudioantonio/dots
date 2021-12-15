import { time } from "console";
import Game from "../logic/Game";

class GameService {
    game: Game;
    lastPlayTimestamp: number;

    constructor() {
        this.game = new Game();
        this.lastPlayTimestamp = -1;
    }

    get(): Game {
        return this.game;
    }

    setPlayTime(): void {
        this.lastPlayTimestamp = (new Date()).getTime();
    }

    // TWO_DEAD_PLAYERS: number = 0;
    // ONE_DEAD_PLAYER: number = 1;

    // deadPlayerChecker = setInterval(function () {
    //     if ((this.game.isReady() === false) && (!game.isInProgress())) return;

    //     let elapsedTimestamp: number;
    //     let situation: number;
    //     const currTimestamp: number = (new Date()).getTime();
    //     if (game.getLastPlayTimestamp() < 0) {
    //         elapsedTimestamp = currTimestamp - game.getStartTimestamp();
    //         situation = TWO_DEAD_PLAYERS;

    //         broadCast('test', {
    //             message: 'TWO DEAD PLAYERS',
    //             gameStart: game.getStartTimestamp(),
    //             lastPlayTimestamp: game.getLastPlayTimestamp(),
    //             elapsedTimestamp: elapsedTimestamp,
    //         });
    //     } else {
    //         elapsedTimestamp = currTimestamp - game.getLastPlayTimestamp();
    //         situation = ONE_DEAD_PLAYER;

    //         broadCast('test', {
    //             message: 'ONE DEAD PLAYERS',
    //             gameStart: game.getStartTimestamp(),
    //             lastPlayTimestamp: game.getLastPlayTimestamp(),
    //             elapsedTimestamp: elapsedTimestamp,
    //         });
    //     }

    //     if (elapsedTimestamp > 60000) {
    //         console.log(game);
    //         handleGameOverByDeadPlayer(situation);
    //     }
    // }, 90000);


    // function handleGameOverByDeadPlayer(situation: number) {
    //     console.log('DEAD PLAYER DETECTED!!!');
    //     const p1: Player = gameService.get().players[0];
    //     const p2: Player = gameService.get().players[1];

    //     if (gameService.get().isBotGame()) {
    //         if (waitingList.getLength() > 0) {
    //             let firstInWaitingList = waitingList.getFirst();
    //             gameService.get().newGame(p1, firstInWaitingList);
    //             broadcastNewGame(firstInWaitingList, waitingList.getAll(), true);
    //         } else {
    //             waitingList.add(p1);
    //             gameService.get().reset();
    //             broadCast('emptyGameRoom', {});
    //         }
    //     } else {
    //         //TODO Refactor solution to answer: Who did the last move?
    //         if (waitingList.getLength() > 0) {
    //             //TODO Start new game between the player who did the last move and first in the waitinglist
    //         } else {
    //             //TODO Start new game between bot and the player who did the last move
    //         }
    //     }
    // }
}

export { GameService };