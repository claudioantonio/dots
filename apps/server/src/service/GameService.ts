import { Socket } from "socket.io";
import Game from "../logic/Game";
import Player from "../logic/Player";
import { SocketService } from "./SocketService";
import { UserService } from "./UserService";
import { WaitingListService } from "./WaitingListService";

class GameService {
    private static INSTANCE: GameService;
    game: Game;
    waitingList: WaitingListService;
    lastPlayTimestamp: number;

    private constructor() {
        this.game = new Game();
        this.lastPlayTimestamp = -1;
        this.waitingList = new WaitingListService();

        // Bind here is needed to give reference also to the GameService state
        // instead of only to onPlayerExit function prototype
        SocketService.getInstance().setDisconnectionListener(this.onPlayerExit.bind(this));

        GameService.INSTANCE = this;
    }

    static getInstance(): GameService {
        if (!GameService.INSTANCE) {
            return new GameService();
        }
        return GameService.INSTANCE;
    }

    enterGame(newPlayerName: string): number {
        let newPlayer: Player = UserService.getInstance().createPlayer(newPlayerName);

        if ((this.get().isReady()) || (this.get().isInProgress())) {
            // Must wait until the current game finishes
            this.getWaitingList().add(newPlayer);
            this.noticeWaitingListUpdate()
        } else {
            // Start playing immediately
            let player1: Player = this.getWaitingList().getFirst();
            this.get().addPlayer(player1);
            this.get().addPlayer(newPlayer);
        }

        return newPlayer.id;
    }

    noticeNewGame(invitedPlayerId: number) {
        // Invite first in waiting room to game room
        SocketService.getInstance().broadcastMessage(
            'enterGameRoom',
            { 'invitationForPlayer': invitedPlayerId }
        );
        // Send info to update waiting room
        this.noticeWaitingListUpdate()
    }

    noticeWaitingListUpdate() {
        SocketService.getInstance().broadcastMessage(
            'waitingRoomUpdate',
            { 'waitingList': this.getWaitingList().getAll() }
        );
    }

    getWaitingList(): WaitingListService {
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

    onPlayerExit(playerId: number) {
        console.log("onPlayerExit", "PlayerId=", playerId);
        // Disconnected player was in waitinglist
        const waitingPlayer = this.getWaitingList().remove(playerId);
        if (waitingPlayer) {
            this.noticeWaitingListUpdate();
            return;
        }
        // Disconnected player was in a game
        let disconnectedPlayer: Player;
        let onlinePlayer: Player;
        if (this.get().players[0].id == playerId) {
            disconnectedPlayer = this.get().players[0];
            onlinePlayer = this.get().players[1];
        } else {
            disconnectedPlayer = this.get().players[1];
            onlinePlayer = this.get().players[0];
        }

        this.get().forceGameOver();
        let playResult = this.get().getGameInfo();
        playResult.message = disconnectedPlayer.name + " gave up. " + onlinePlayer.name + " won!";
        if (this.getWaitingList().getLength() > 0) {
            // There is at least the bot in the waiting list
            let playerInvited = this.getWaitingList().getFirst();
            this.get().newGame(onlinePlayer, playerInvited);
            this.noticeNewGame(playerInvited.id);
            playResult.whatsNext = this.createPassport(playerInvited, 'GameRoom', disconnectedPlayer, 'ExitGame');
            SocketService.getInstance().broadcastMessage('gameOver', playResult);
        } else {
            // Game with a bot with no one in the waiting list
            this.get().reset();
            this.getWaitingList().reset();
        }
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