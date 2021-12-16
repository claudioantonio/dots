import { Router } from 'express';

import Player from './logic/Player';
import BotPlayer from './logic/BotPlayer';
import { WaitingListService } from './service/WaitingListService';
import { RegisterController } from './controller/RegisterController';
import { GameService } from './service/GameService';
import { TurnController } from './controller/TurnController';
import { GetGameInfoController } from './controller/GetGameInfoController';
import { GetWaitingRoomController } from './controller/GetWaitingRoomController';
import { BotTurnController } from './controller/BotTurnContoller';

let socketServer: any;

const routes = Router();

const gameService: GameService = new GameService();


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
    new RegisterController().handle(req, res, gameService, IDVAL, broadCast);
});


routes.get('/gameinfo', (req, res) => {
    new GetGameInfoController().handle(req, res, gameService);
});

routes.get('/waitingroom', (req, res) => {
    new GetWaitingRoomController().handle(req, res, gameService);
});


routes.post('/botPlay', (req, res) => {
    new BotTurnController().handle(req, res, gameService, broadCast, broadcastNewGame);
});

routes.post('/selection', (req, res) => {
    new TurnController().handle(req, res, gameService, broadCast, broadcastNewGame);
});

routes.get('/reset', (req, res) => {
    console.log('routes: before reset' + gameService.get().players);
    gameService.getWaitingList().reset();
    gameService.get().reset();
    console.log('routes: after reset' + gameService.get().players);
    return res.status(201);
});


function createWaitingRoomUpdateJSON(waitingList: any) {
    return {
        'waitingList': waitingList
    };
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

function getSocket() {
    return socketServer;
}

function broadCast(message: string, info: any) {
    const io = getSocket();
    io.emit(message, info);
}


function disconnectHandler() {
    console.log('Routes - A client disconnected');
}

export default function (SocketIO: any) {
    socketServer = SocketIO.io;
    SocketIO.setDisconnectListener(disconnectHandler);
    return routes;
}