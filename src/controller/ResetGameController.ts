import { Request, Response } from "express";
import { GameService } from "../service/GameService";

class ResetGameController {
    handle(request: Request, response: Response, gameService: GameService) {
        console.log('routes: before reset' + gameService.get().players);
        gameService.getWaitingList().reset();
        gameService.get().reset();
        console.log('routes: after reset' + gameService.get().players);
        return response.status(201);
    }
}

export { ResetGameController };