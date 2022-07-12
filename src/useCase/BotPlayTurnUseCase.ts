import BotPlayer from "../logic/BotPlayer";
import Edge from "../logic/Edge";
import { GameConstants } from "../logic/GameConstants";
import { GameService } from "../service/GameService";
import { SocketService } from "../service/SocketService";

export class BotPlayTurnUseCase {

    async execute() {
        console.log("BotPlayTurnUseCase was called");

        GameService.getInstance().setPlayTime();

        const botPlayer: BotPlayer = GameService.getInstance().get().players[0] as BotPlayer;
        let playResult = botPlayer.play(GameService.getInstance().get());
        if (GameService.getInstance().get().isOver()) {
            this.handleGameOver(playResult);
        } else {
            SocketService.getInstance().broadcastMessage('gameUpdate', playResult);
        }
        return playResult;
    }

    // TODO - Duplicated in TurnController
    private handleGameOver(playResult: any) {
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
        console.log('whats next?', playResult.whatsNext);
    }
}