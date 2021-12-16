import { Router } from 'express';

import Player from './logic/Player';
import BotPlayer from './logic/BotPlayer';
import { WaitingListService } from './service/WaitingListService';
import { RegisterController } from './controller/RegisterController';
import { GameService } from './service/GameService';
import { TurnController } from './controller/TurnController';

let socketServer: any;

const routes = Router();

const gameService: GameService = new GameService();
const waitingList: WaitingListService = new WaitingListService();

const INITIAL_ID: number = 1;
let IDVAL: number = INITIAL_ID;

function createPlayerId() {
    return IDVAL++;
}

/**
 * Endpoint to register players
 * 
 * Emit by socket message to update waiting room for all players
 * 
 * Return player id and a pass to waiting room or game room according
 * with waiting list and game situation
 */
routes.post('/register', (req, res) => {
    new RegisterController().handle(req, res, waitingList, gameService, IDVAL, broadCast);
});

function createWaitingRoomUpdateJSON(waitingList: any) {
    return {
        'waitingList': waitingList
    };
}

function createGameSetup() {
    const setup: any = gameService.get().getGameSetup();
    return ({
        gridsize: setup.gridsize,
        player1Id: setup.player1Id,
        player1: setup.player1,
        player2: setup.player2,
        score_player1: setup.score_player1,
        score_player2: setup.score_player2,
        turn: setup.turn,
        gameOver: setup.gameOver,
        waitinglist: waitingList.getAll()
    });
}

routes.get('/gameinfo', (req, res) => {
    return res.status(201).json(
        createGameSetup()
    );
});

routes.get('/waitingroom', (req, res) => {
    console.log(gameService.get().players);
    let player1name: string;
    let player2name: string;
    if (gameService.get().isReady() || gameService.get().isInProgress()) {
        player1name = gameService.get().players[0].name;
        player2name = gameService.get().players[1].name;
    } else {
        player1name = '???';
        player2name = '???';
    }
    return res.status(201).json({
        'gameStatus': gameService.get().getStatus(),
        'player1': player1name,
        'player2': player2name,
        'waitingList': waitingList.getAll()
    });
});

// TODO - REFACTOR FOR GOD SAKE!!!
function handleGameOver(req: any, playResult: any) {
    const winner = gameService.get().getWinner();
    const looser = gameService.get().getLooser();

    if (waitingList.getLength() > 0) {
        // Add looser to waiting list
        waitingList.add(looser);
        // Prepare new game
        let playerInvited = waitingList.getFirst();
        if (winner != null) {
            gameService.get().newGame(winner, playerInvited);
        }
        // Keep winner in game room and send looser to the waiting room
        playResult.whatsNext = gameService.createPassport(winner!, 'GameRoom', looser, 'waitingRoom');
        broadcastNewGame(playerInvited, waitingList.getAll(), false);
    } else {
        // Start a new game with same players
        gameService.get().newGame(winner!, looser);
        playResult.whatsNext = gameService.createPassport(winner!, 'GameRoom', looser, 'GameRoom');
    }
    console.log('whats next?', playResult.whatsNext);
}

routes.post('/botPlay', (req, res) => {
    console.log('botPlay endpoint was called');

    gameService.setPlayTime();

    if (gameService.get().getTurn() != 0) {
        return res.status(400).json({
            'message': 'Play rejected because it´s not your turn',
        });
    }

    const botPlayer: BotPlayer = gameService.get().players[0] as BotPlayer;
    let playResult = botPlayer.play(gameService.get());
    if (gameService.get().isOver()) {
        handleGameOver(req, playResult);
    } else {
        broadCast('gameUpdate', playResult);
    }
    return res.status(201).json(playResult);
});

routes.post('/selection', (req, res) => {
    new TurnController().handle(req, res, gameService, waitingList, broadCast, broadcastNewGame);
});

function broadcastNewGame(playerInvited: Player, waitingList: Player[], reloadClient: boolean) {
    // Invite first in waiting room to game room
    broadCast('enterGameRoom', {
        'invitationForPlayer': playerInvited.id,
    });
    // Send info to update waiting room
    broadCast(
        'waitingRoomUpdate',
        createWaitingRoomUpdateJSON(waitingList)
    );
    // Send event to reload clients page :-\
    // TODO Complete page reload is not SPA behavior....
    if (reloadClient) {
        broadCast('reloadGameRoom', {});
    }
}

function getSocket() {
    return socketServer;
}

function broadCast(message: string, info: any) {
    const io = getSocket();
    io.emit(message, info);
}

routes.get('/reset', (req, res) => {
    console.log('routes: before reset' + gameService.get().players);
    waitingList.reset();
    gameService.get().reset();
    console.log('routes: after reset' + gameService.get().players);
    return res.status(201);
});

function disconnectHandler() {
    console.log('Routes - A client disconnected');
}

export default function (SocketIO: any) {
    socketServer = SocketIO.io;
    SocketIO.setDisconnectListener(disconnectHandler);
    return routes;
}