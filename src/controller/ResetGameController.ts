import { Request, Response } from "express";
import { GameService } from "../service/GameService";

class ResetGameController {
    handle(request: Request, response: Response) {
        console.log('routes: before reset' + GameService.getInstance().get().players);
        GameService.getInstance().getWaitingList().reset();
        GameService.getInstance().get().reset();
        console.log('routes: after reset' + GameService.getInstance().get().players);
        return response.status(201);
    }
}

export { ResetGameController };