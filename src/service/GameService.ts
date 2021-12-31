import Game from "../logic/Game";
import Player from "../logic/Player";
import { SocketService } from "./SocketService";
import { WaitingListService } from "./WaitingListService";

class GameService {
    game: Game;
    waitingList: WaitingListService;
    lastPlayTimestamp: number;

    constructor() {
        this.game = new Game();
        this.lastPlayTimestamp = -1;
        this.waitingList = new WaitingListService();
    }

    enterGame(newPlayer: Player) {
        if ((this.get().isReady()) || (this.get().isInProgress())) {
            this.getWaitingList().add(newPlayer);
            SocketService.getInstance().broadcastMessage(
                'waitingRoomUpdate',
                { 'waitingList': this.getWaitingList().getAll() }
            );
        } else { // Waiting for a player
            let player1: Player = this.getWaitingList().getFirst();
            this.get().addPlayer(player1);
            this.get().addPlayer(newPlayer);
        }
    }

    noticeNewGame(invitedPlayerId: number, reloadClient: boolean) {
        // Invite first in waiting room to game room
        SocketService.getInstance().broadcastMessage(
            'enterGameRoom',
            { 'invitationForPlayer': invitedPlayerId }
        );
        // Send info to update waiting room
        SocketService.getInstance().broadcastMessage(
            'waitingRoomUpdate',
            { 'waitingList': this.getWaitingList().getAll() }
        );
        // Send event to reload clients page :-\
        // TODO Complete page reload is not SPA behavior....
        if (reloadClient) {
            SocketService.getInstance().broadcastMessage(
                'reloadGameRoom',
                {}
            );
        }
    }

    getWaitingList() {
        return this.waitingList;
    }

    get(): Game {
        return this.game;
    }

    setPlayTime(): void {
        this.lastPlayTimestamp = (new Date()).getTime();
    }

    createPassport(p1: Player, roomForP1: string, p2: Player, roomForP2: string) {
        return {
            winner: {
                'playerId': p1.id,
                'roomPass': roomForP1,
            },
            looser: {
                'playerId': p2.id,
                'roomPass': roomForP2,
            }
        }
    }

    createGameSetup() {
        const setup: any = this.get().getGameSetup();
        return ({
            gridsize: setup.gridsize,
            player1Id: setup.player1Id,
            player1: setup.player1,
            player2: setup.player2,
            score_player1: setup.score_player1,
            score_player2: setup.score_player2,
            turn: setup.turn,
            gameOver: setup.gameOver,
            waitinglist: this.getWaitingList().getAll()
        });
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