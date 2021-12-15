import { Router } from 'express';
import socketIo from 'socket.io';

import Player from './logic/Player';
import Edge from './logic/Edge';
import Game from './logic/Game';
import Point from './logic/Point';
import BotPlayer from './logic/BotPlayer';
import { WaitingListService } from './service/WaitingListService';
import { RegisterController } from './RegisterController';
import { GameService } from './service/GameService';

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
    console.log('selection endpoint called');

    const playerId: number = req.body.player;
    if (gameService.get().getTurn() != playerId) {
        return res.status(400).json({
            'message': 'Play rejected because it´s not your turn',
        });
    }

    gameService.setPlayTime();

    const x1: number = req.body.x1;
    const y1: number = req.body.y1
    const x2: number = req.body.x2;
    const y2: number = req.body.y2

    const p1: Point = new Point(x1, y1);
    const p2: Point = new Point(x2, y2);
    const edge: Edge = new Edge(p1, p2);

    let playResult = gameService.get().play(playerId, edge);

    if (gameService.get().isOver()) {
        if (gameService.get().isOverByDraw()) {
            console.log('Gameover by draw');
            handleGameOverByDraw(req, playResult);
        } else {
            console.log('Gameover with winner');
            handleGameOver(req, playResult);
        }
    }

    broadCast('gameUpdate', playResult);

    return res.status(201).json(playResult);
});

function handleGameOverByDraw(req: any, playResult: any) {
    const p1 = gameService.get().players[0];
    const p2 = gameService.get().players[1];
    gameService.get().newGame(p1, p2);
    playResult.whatsNext = createPassport(p1, 'GameRoom', p2, 'GameRoom');
}

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
        playResult.whatsNext = createPassport(winner!, 'GameRoom', looser, 'waitingRoom');
        broadcastNewGame(playerInvited, waitingList.getAll(), false);
    } else {
        // Start a new game with same players
        gameService.get().newGame(winner!, looser);
        playResult.whatsNext = createPassport(winner!, 'GameRoom', looser, 'GameRoom');
    }
}


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

function createPassport(p1: Player, roomForP1: string, p2: Player, roomForP2: string) {
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