import { Router } from 'express';

import { RegisterController } from './controller/RegisterController';
import { TurnController } from './controller/TurnController';
import { GetGameInfoController } from './controller/GetGameInfoController';
import { GetWaitingRoomController } from './controller/GetWaitingRoomController';
import { BotTurnController } from './controller/BotTurnContoller';
import { ResetGameController } from './controller/ResetGameController';

const routes = Router();

/**
 * Endpoint to register players
 * 
 * Emit by socket message to update waiting room for all players
 * 
 * Return player id and a pass to waiting room or game room according
 * with waiting list and game situation
 */
routes.post('/register', (req, res) => {
    new RegisterController().handle(req, res);
});

routes.get('/gameinfo', (req, res) => {
    new GetGameInfoController().handle(req, res);
});

routes.get('/waitingroom', (req, res) => {
    new GetWaitingRoomController().handle(req, res);
});

routes.post('/botPlay', (req, res) => {
    new BotTurnController().handle(req, res);
});

routes.post('/selection', (req, res) => {
    new TurnController().handle(req, res);
});

routes.get('/reset', (req, res) => {
    new ResetGameController().handle(req, res);
});

export default routes;