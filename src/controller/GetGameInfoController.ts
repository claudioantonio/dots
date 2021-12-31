import { Request, Response } from "express";
import { GameService } from "../service/GameService";

class GetGameInfoController {
    handle(request: Request, response: Response) {
        return response.status(201).json(
            GameService.getInstance().createGameSetup()
        );
    }
}

export { GetGameInfoController };