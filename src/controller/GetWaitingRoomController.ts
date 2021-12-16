import { Request, Response } from "express";
import { GameService } from "../service/GameService";

class GetWaitingRoomController {
    handle(request: Request, response: Response, gameService: GameService) {
        console.log(gameService.get().players);
        let player1name: string;
        let player2name: string;
        if (gameService.get().isReady() || gameService.get().isInProgress()) {
            player1name = gameService.get().players[0].name;
            player2name = gameService.get().players[1].name;
        } else {
            player1name = '???';
            player2name = '???';
        }
        return response.status(201).json({
            'gameStatus': gameService.get().getStatus(),
            'player1': player1name,
            'player2': player2name,
            'waitingList': gameService.getWaitingList().getAll()
        });
    }
}

export { GetWaitingRoomController };