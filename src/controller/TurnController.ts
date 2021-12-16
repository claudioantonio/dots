import { Request, Response } from "express";
import Edge from "../logic/Edge";
import Point from "../logic/Point";
import { GameService } from "../service/GameService";
import { WaitingListService } from "../service/WaitingListService";

class TurnController {

    handle(request: Request, response: Response, gameService: GameService, waitingList: WaitingListService, broadCast: Function, broadcastNewGame: Function) {
        console.log('selection endpoint called');

        const playerId: number = request.body.player;
        if (gameService.get().getTurn() != playerId) {
            return response.status(400).json({
                'message': 'Play rejected because it´s not your turn',
            });
        }

        gameService.setPlayTime();

        const x1: number = request.body.x1;
        const y1: number = request.body.y1
        const x2: number = request.body.x2;
        const y2: number = request.body.y2

        const p1: Point = new Point(x1, y1);
        const p2: Point = new Point(x2, y2);
        const edge: Edge = new Edge(p1, p2);

        let playResult = gameService.get().play(playerId, edge);

        if (gameService.get().isOver()) {
            if (gameService.get().isOverByDraw()) {
                console.log('Gameover by draw');
                this.handleGameOverByDraw(request, playResult, gameService);
            } else {
                console.log('Gameover with winner');
                this.handleGameOver(request, playResult, gameService, waitingList, broadCast, broadcastNewGame);
            }
        }

        broadCast('gameUpdate', playResult);

        return response.status(201).json(playResult);
    }

    private handleGameOverByDraw(req: any, playResult: any, gameService: GameService) {
        const p1 = gameService.get().players[0];
        const p2 = gameService.get().players[1];
        gameService.get().newGame(p1, p2);
        playResult.whatsNext = gameService.createPassport(p1, 'GameRoom', p2, 'GameRoom');
    }

    // TODO - REFACTOR FOR GOD SAKE!!!
    private handleGameOver(req: any, playResult: any, gameService: GameService, waitingList: WaitingListService, broadcastNewGame: Function) {
        const winner = gameService.get().getWinner();
        const looser = gameService.get().getLooser();

        if (waitingList.getLength() > 0) {
            // Add looser to waiting list
            waitingList.add(looser);
            // Prepare new game
            let playerInvited = waitingList.getFirst();
            if (winner != null) {
                gameService.get().newGame(winner, playerInvited);
            }
            // Keep winner in game room and send looser to the waiting room
            playResult.whatsNext = gameService.createPassport(winner!, 'GameRoom', looser, 'waitingRoom');
            broadcastNewGame(playerInvited, waitingList.getAll(), false);
        } else {
            // Start a new game with same players
            gameService.get().newGame(winner!, looser);
            playResult.whatsNext = gameService.createPassport(winner!, 'GameRoom', looser, 'GameRoom');
        }
    }
}

export { TurnController };