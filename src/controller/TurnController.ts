import { Request, Response } from "express";
import Edge from "../logic/Edge";
import Point from "../logic/Point";
import { GameService } from "../service/GameService";
import { SocketService } from "../service/SocketService";

class TurnController {

    handle(request: Request, response: Response) {
        console.log('TurnController was called');

        const playerId: number = request.body.player;
        if (GameService.getInstance().get().getTurn() != playerId) {
            return response.status(400).json({
                'message': 'Play rejected because it´s not your turn',
            });
        }

        GameService.getInstance().setPlayTime();

        const x1: number = request.body.x1;
        const y1: number = request.body.y1
        const x2: number = request.body.x2;
        const y2: number = request.body.y2

        const p1: Point = new Point(x1, y1);
        const p2: Point = new Point(x2, y2);
        const edge: Edge = new Edge(p1, p2);

        let playResult = GameService.getInstance().get().play(playerId, edge);

        if (GameService.getInstance().get().isOver()) {
            if (GameService.getInstance().get().isOverByDraw()) {
                console.log('Gameover by draw');
                this.handleGameOverByDraw(request, playResult);
            } else {
                console.log('Gameover with winner');
                this.handleGameOver(request, playResult);
            }
            SocketService.getInstance().broadcastMessage('gameOver', playResult);
        } else {
            SocketService.getInstance().broadcastMessage('gameUpdate', playResult);
        }


        return response.sendStatus(201);
    }

    private handleGameOverByDraw(req: any, playResult: any) {
        const p1 = GameService.getInstance().get().players[0];
        const p2 = GameService.getInstance().get().players[1];
        GameService.getInstance().get().newGame(p1, p2);
        playResult.whatsNext = GameService.getInstance().createPassport(p1, 'GameRoom', p2, 'GameRoom');
    }

    // TODO - REFACTOR FOR GOD SAKE!!!
    private handleGameOver(req: any, playResult: any) {
        const winner = GameService.getInstance().get().getWinner();
        const looser = GameService.getInstance().get().getLooser();

        if (GameService.getInstance().getWaitingList().getLength() > 0) {
            // Add looser to waiting list
            GameService.getInstance().getWaitingList().add(looser);
            // Prepare new game
            let playerInvited = GameService.getInstance().getWaitingList().getFirst();
            if (winner != null) {
                GameService.getInstance().get().newGame(winner, playerInvited);
            }
            // Keep winner in game room and send looser to the waiting room
            playResult.whatsNext = GameService.getInstance().createPassport(winner!, 'GameRoom', looser, 'waitingRoom');
            GameService.getInstance().noticeNewGame(playerInvited.id);
        } else {
            // Start a new game with same players
            GameService.getInstance().get().newGame(winner!, looser);
            playResult.whatsNext = GameService.getInstance().createPassport(winner!, 'GameRoom', looser, 'GameRoom');
        }
    }
}

export { TurnController };