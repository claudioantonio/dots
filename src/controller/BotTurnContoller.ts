import { Request, Response } from "express";
import BotPlayer from "../logic/BotPlayer";
import { GameService } from "../service/GameService";
import { SocketService } from "../service/SocketService";

class BotTurnController {
    handle(request: Request, response: Response) {
        console.log('botPlay endpoint was called');

        GameService.getInstance().setPlayTime();

        if (GameService.getInstance().get().getTurn() != 0) {
            return response.status(400).json({
                'message': 'Play rejected because it´s not your turn',
            });
        }

        const botPlayer: BotPlayer = GameService.getInstance().get().players[0] as BotPlayer;
        let playResult = botPlayer.play(GameService.getInstance().get());
        if (GameService.getInstance().get().isOver()) {
            this.handleGameOver(request, playResult, GameService.getInstance());
        } else {
            SocketService.getInstance().broadcastMessage('gameUpdate', playResult);
        }
        return response.status(201).json(playResult);
    }

    // TODO - Duplicated in TurnController
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
            GameService.getInstance().noticeNewGame(playerInvited.id, false);
        } else {
            // Start a new game with same players
            GameService.getInstance().get().newGame(winner!, looser);
            playResult.whatsNext = GameService.getInstance().createPassport(winner!, 'GameRoom', looser, 'GameRoom');
        }
        console.log('whats next?', playResult.whatsNext);
    }
}

export { BotTurnController };