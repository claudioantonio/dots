import { Router } from 'express';
import socketIo from 'socket.io';

import Player from './logic/Player';
import Edge from './logic/Edge';
import Game from './logic/Game';
import Point from './logic/Point';
import BotPlayer from './logic/BotPlayer';
import { WaitingListService } from './service/WaitingListService';

let socketServer: any;

const routes = Router();

const game: Game = new Game();
let lastPlayTimestamp: number = -1;

const waitingList: WaitingListService = new WaitingListService();

const INITIAL_ID: number = 1;
let IDVAL: number = INITIAL_ID;

const TWO_DEAD_PLAYERS: number = 0;
const ONE_DEAD_PLAYER: number = 1;

const deadPlayerChecker = setInterval(function () {
    if ((game.isReady() === false) && (!game.isInProgress())) return;

    let elapsedTimestamp: number;
    let situation: number;
    const currTimestamp: number = (new Date()).getTime();
    if (game.getLastPlayTimestamp() < 0) {
        elapsedTimestamp = currTimestamp - game.getStartTimestamp();
        situation = TWO_DEAD_PLAYERS;

        broadCast('test', {
            message: 'TWO DEAD PLAYERS',
            gameStart: game.getStartTimestamp(),
            lastPlayTimestamp: game.getLastPlayTimestamp(),
            elapsedTimestamp: elapsedTimestamp,
        });
    } else {
        elapsedTimestamp = currTimestamp - game.getLastPlayTimestamp();
        situation = ONE_DEAD_PLAYER;

        broadCast('test', {
            message: 'ONE DEAD PLAYERS',
            gameStart: game.getStartTimestamp(),
            lastPlayTimestamp: game.getLastPlayTimestamp(),
            elapsedTimestamp: elapsedTimestamp,
        });
    }

    if (elapsedTimestamp > 60000) {
        console.log(game);
        handleGameOverByDeadPlayer(situation);
    }
}, 90000);


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
    try {
        const newPlayerName: string = req.body.user;
        const newPlayerId: number = createPlayerId();

        let player1: Player | null = null;
        let player2: Player | null = null;
        let roomPass: string = 'GameRoom';

        if ((game.isReady()) || (game.isInProgress())) {
            waitingList.add(new Player(newPlayerId, newPlayerName));
            broadCast(
                'waitingRoomUpdate',
                createWaitingRoomUpdateJSON(waitingList.getAll())
            );
        } else { // Waiting for a player
            player1 = waitingList.getFirst();
            player2 = new Player(newPlayerId, newPlayerName);
            game.addPlayer(player1);
            game.addPlayer(player2);
        }

        return res.status(201).json({
            'playerId': newPlayerId,
            'roomPass': roomPass
        });
    } catch (e) {
        console.log(e);
        return res.status(400).json({
            error: 'Routes: Unexpected error while registering new player'
        });
    }
});

function createWaitingRoomUpdateJSON(waitingList: any) {
    return {
        'waitingList': waitingList
    };
}

function createGameSetup() {
    const setup: any = game.getGameSetup();
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
    console.log(game.players);
    let player1name: string;
    let player2name: string;
    if (game.isReady() || game.isInProgress()) {
        player1name = game.players[0].name;
        player2name = game.players[1].name;
    } else {
        player1name = '???';
        player2name = '???';
    }
    return res.status(201).json({
        'gameStatus': game.getStatus(),
        'player1': player1name,
        'player2': player2name,
        'waitingList': waitingList.getAll()
    });
});

routes.post('/botPlay', (req, res) => {
    console.log('botPlay endpoint was called');

    lastPlayTimestamp = (new Date()).getTime();

    if (game.getTurn() != 0) {
        return res.status(400).json({
            'message': 'Play rejected because it´s not your turn',
        });
    }

    const botPlayer: BotPlayer = game.players[0] as BotPlayer;
    let playResult = botPlayer.play(game);
    if (game.isOver()) {
        handleGameOver(req, playResult);
    } else {
        broadCast('gameUpdate', playResult);
    }
    return res.status(201).json(playResult);
});

routes.post('/selection', (req, res) => {
    console.log('selection endpoint called');

    const playerId: number = req.body.player;
    if (game.getTurn() != playerId) {
        return res.status(400).json({
            'message': 'Play rejected because it´s not your turn',
        });
    }

    lastPlayTimestamp = (new Date()).getTime();

    const x1: number = req.body.x1;
    const y1: number = req.body.y1
    const x2: number = req.body.x2;
    const y2: number = req.body.y2

    const p1: Point = new Point(x1, y1);
    const p2: Point = new Point(x2, y2);
    const edge: Edge = new Edge(p1, p2);

    let playResult = game.play(playerId, edge);

    if (game.isOver()) {
        if (game.isOverByDraw()) {
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
    const p1 = game.players[0];
    const p2 = game.players[1];
    game.newGame(p1, p2);
    playResult.whatsNext = createPassport(p1, 'GameRoom', p2, 'GameRoom');
}

// TODO - REFACTOR FOR GOD SAKE!!!
function handleGameOver(req: any, playResult: any) {
    const winner = game.getWinner();
    const looser = game.getLooser();

    if (waitingList.getLength() > 0) {
        // Add looser to waiting list
        waitingList.add(looser);
        // Prepare new game
        let playerInvited = waitingList.getFirst();
        if (winner != null) {
            game.newGame(winner, playerInvited);
        }
        // Keep winner in game room and send looser to the waiting room
        playResult.whatsNext = createPassport(winner!, 'GameRoom', looser, 'waitingRoom');
        broadcastNewGame(playerInvited, waitingList.getAll(), false);
    } else {
        // Start a new game with same players
        game.newGame(winner!, looser);
        playResult.whatsNext = createPassport(winner!, 'GameRoom', looser, 'GameRoom');
    }
}

function handleGameOverByDeadPlayer(situation: number) {
    console.log('DEAD PLAYER DETECTED!!!');
    const p1: Player = game.players[0];
    const p2: Player = game.players[1];

    if (game.isBotGame()) {
        if (waitingList.getLength() > 0) {
            let firstInWaitingList = waitingList.getFirst();
            game.newGame(p1, firstInWaitingList);
            broadcastNewGame(firstInWaitingList, waitingList.getAll(), true);
        } else {
            waitingList.add(p1);
            game.reset();
            broadCast('emptyGameRoom', {});
        }
    } else {
        //TODO Refactor solution to answer: Who did the last move?
        if (waitingList.getLength() > 0) {
            //TODO Start new game between the player who did the last move and first in the waitinglist
        } else {
            //TODO Start new game between bot and the player who did the last move
        }
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
    console.log('routes: before reset' + game.players);
    waitingList.reset();
    game.reset();
    console.log('routes: after reset' + game.players);
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