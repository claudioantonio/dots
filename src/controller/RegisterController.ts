import { Request, Response } from "express";
import Player from "../logic/Player";
import { GameService } from "../service/GameService";
import { UserService } from "../service/UserService";

class RegisterController {

    handle(
        request: Request, response: Response,
        gameService: GameService, userService: UserService, broadCast: Function
    ) {
        try {
            const newPlayerName: string = request.body.user;

            let newPlayer: Player = userService.createPlayer(newPlayerName);;
            let roomPass: string = 'GameRoom';

            gameService.enterGame(newPlayer, broadCast);

            return response.status(201).json({
                'playerId': newPlayer.id,
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