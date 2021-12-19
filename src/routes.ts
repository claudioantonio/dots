import { Router } from 'express';

import Player from './logic/Player';
import { RegisterController } from './controller/RegisterController';
import { GameService } from './service/GameService';
import { TurnController } from './controller/TurnController';
import { GetGameInfoController } from './controller/GetGameInfoController';
import { GetWaitingRoomController } from './controller/GetWaitingRoomController';
import { BotTurnController } from './controller/BotTurnContoller';
import { ResetGameController } from './controller/ResetGameController';
import { UserService } from './service/UserService';

let socketServer: any;

const routes = Router();

const gameService: GameService = new GameService();
const userService: UserService = UserService.getInstance();

/**
 * Endpoint to register players
 * 
 * Emit by socket message to update waiting room for all players
 * 
 * Return player id and a pass to waiting room or game room according
 * with waiting list and game situation
 */
routes.post('/register', (req, res) => {
    new RegisterController().handle(req, res, gameService, userService, broadCast);
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
    new ResetGameController().handle(req, res, gameService);
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