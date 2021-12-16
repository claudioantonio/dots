import { Request, Response } from "express";
import Game from "../logic/Game";
import Player from "../logic/Player";
import { GameService } from "../service/GameService";
import { WaitingListService } from "../service/WaitingListService";

class RegisterController {

    handle(
        request: Request, response: Response,
        gameService: GameService, IDVAL: number, broadCast: Function
    ) {
        try {
            const newPlayerName: string = request.body.user;
            const newPlayerId: number = IDVAL++;

            let player1: Player | null = null;
            let player2: Player | null = null;
            let roomPass: string = 'GameRoom';

            if ((gameService.get().isReady()) || (gameService.get().isInProgress())) {
                gameService.getWaitingList().add(new Player(newPlayerId, newPlayerName));
                broadCast(
                    'waitingRoomUpdate',
                    {
                        'waitingList': gameService.getWaitingList().getAll()
                    }
                );
            } else { // Waiting for a player
                player1 = gameService.getWaitingList().getFirst();
                player2 = new Player(newPlayerId, newPlayerName);
                gameService.get().addPlayer(player1);
                gameService.get().addPlayer(player2);
            }

            return response.status(201).json({
                'playerId': newPlayerId,
                'roomPass': roomPass
            });
        } catch (e) {
            console.log(e);
            return response.status(400).json({
                error: 'Routes: Unexpected error while registering new player'
            });
        }
    }
}

export { RegisterController };