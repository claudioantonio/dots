import { Request, Response } from "express";
import { GameService } from "../service/GameService";

class GetWaitingRoomController {
    handle(request: Request, response: Response) {
        console.log(GameService.getInstance().get().players);
        let player1name: string;
        let player2name: string;
        if (GameService.getInstance().get().isReady() || GameService.getInstance().get().isInProgress()) {
            player1name = GameService.getInstance().get().players[0].name;
            player2name = GameService.getInstance().get().players[1].name;
        } else {
            player1name = '???';
            player2name = '???';
        }
        return response.status(201).json({
            'gameStatus': GameService.getInstance().get().getStatus(),
            'player1': player1name,
            'player2': player2name,
            'waitingList': GameService.getInstance().getWaitingList().getAll()
        });
    }
}

export { GetWaitingRoomController };