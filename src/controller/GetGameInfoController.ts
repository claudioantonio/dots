import { Request, Response } from "express";
import { GameService } from "../service/GameService";

class GetGameInfoController {
    handle(request: Request, response: Response, gameService: GameService) {
        return response.status(201).json(
            gameService.createGameSetup()
        );
    }
}

export { GetGameInfoController };