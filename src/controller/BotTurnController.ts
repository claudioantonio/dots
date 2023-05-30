import { Request, Response } from "express";
import BotPlayer from "../logic/BotPlayer";
import { GameService } from "../service/GameService";
import { SocketService } from "../service/SocketService";
import { BotPlayTurnUseCase } from "../useCase/BotPlayTurnUseCase";

class BotTurnController {
    handle(request: Request, response: Response) {
        console.log('BotTurnController was called');

        if (GameService.getInstance().get().getTurn() != 0) {
            return response.status(400).json({
                'message': 'Play rejected because it´s not your turn',
            });
        }

        new BotPlayTurnUseCase().execute();

        return response.sendStatus(201);
    }
}

export { BotTurnController };