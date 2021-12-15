import { Request, Response } from "express";
import Game from "./logic/Game";
import Player from "./logic/Player";
import { WaitingListService } from "./service/WaitingListService";

class RegisterController {

    handle(
        request: Request, response: Response, waitingList: WaitingListService,
        game: Game, IDVAL: number, broadCast: Function
    ) {
        try {
            const newPlayerName: string = request.body.user;
            const newPlayerId: number = IDVAL++;

            let player1: Player | null = null;
            let player2: Player | null = null;
            let roomPass: string = 'GameRoom';

            if ((game.isReady()) || (game.isInProgress())) {
                waitingList.add(new Player(newPlayerId, newPlayerName));
                broadCast(
                    'waitingRoomUpdate',
                    {
                        'waitingList': waitingList.getAll()
                    }
                );
            } else { // Waiting for a player
                player1 = waitingList.getFirst();
                player2 = new Player(newPlayerId, newPlayerName);
                game.addPlayer(player1);
                game.addPlayer(player2);
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