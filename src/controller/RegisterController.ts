import { Request, Response } from "express";
import { GameService } from "../service/GameService";

class RegisterController {

    handle(request: Request, response: Response) {
        try {
            const newPlayerName: string = request.body.user;
            const newPlayerId = GameService.getInstance().enterGame(newPlayerName);

            return response.status(201).json({
                'playerId': newPlayerId,
                'roomPass': 'GameRoom'
            });
        } catch (e) {
            console.log(e);
            return response.status(400).json({
                error: 'RegisterController: Unexpected error while registering new player'
            });
        }
    }
}

export { RegisterController };