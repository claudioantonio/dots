import { Request, Response } from "express";
import BotPlayer from "../logic/BotPlayer";
import { GameService } from "../service/GameService";
import { SocketService } from "../service/SocketService";

class BotTurnController {
    handle(request: Request, response: Response, gameService: GameService) {
        console.log('botPlay endpoint was called');

        gameService.setPlayTime();

        if (gameService.get().getTurn() != 0) {
            return response.status(400).json({
                'message': 'Play rejected because it´s not your turn',
            });
        }

        const botPlayer: BotPlayer = gameService.get().players[0] as BotPlayer;
        let playResult = botPlayer.play(gameService.get());
        if (gameService.get().isOver()) {
            this.handleGameOver(request, playResult, gameService);
        } else {
            SocketService.getInstance().broadcastMessage('gameUpdate', playResult);
        }
        return response.status(201).json(playResult);
    }

    // TODO - Duplicated in TurnController
    private handleGameOver(req: any, playResult: any, gameService: GameService) {
        const winner = gameService.get().getWinner();
        const looser = gameService.get().getLooser();

        if (gameService.getWaitingList().getLength() > 0) {
            // Add looser to waiting list
            gameService.getWaitingList().add(looser);
            // Prepare new game
            let playerInvited = gameService.getWaitingList().getFirst();
            if (winner != null) {
                gameService.get().newGame(winner, playerInvited);
            }
            // Keep winner in game room and send looser to the waiting room
            playResult.whatsNext = gameService.createPassport(winner!, 'GameRoom', looser, 'waitingRoom');
            gameService.noticeNewGame(playerInvited.id, false);
        } else {
            // Start a new game with same players
            gameService.get().newGame(winner!, looser);
            playResult.whatsNext = gameService.createPassport(winner!, 'GameRoom', looser, 'GameRoom');
        }
        console.log('whats next?', playResult.whatsNext);
    }

}

export { BotTurnController };