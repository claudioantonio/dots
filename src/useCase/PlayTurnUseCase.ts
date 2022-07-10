import Edge from "../logic/Edge";
import { GameService } from "../service/GameService";
import { SocketService } from "../service/SocketService";

export class PlayTurnUseCase {

    async execute(playerId: number, edge: Edge) {
        GameService.getInstance().setPlayTime();

        let playResult = GameService.getInstance().get().play(playerId, edge);

        if (GameService.getInstance().get().isOver()) {
            if (GameService.getInstance().get().isOverByDraw()) {
                console.log('Gameover by draw');
                this.handleGameOverByDraw(playResult);
            } else {
                console.log('Gameover with winner');
                this.handleGameOver(playResult);
            }
            SocketService.getInstance().broadcastMessage('gameOver', playResult);
        } else {
            SocketService.getInstance().broadcastMessage('gameUpdate', playResult);
        }
    }

    private handleGameOverByDraw(playResult: any) {
        const p1 = GameService.getInstance().get().players[0];
        const p2 = GameService.getInstance().get().players[1];
        GameService.getInstance().get().newGame(p1, p2);
        playResult.whatsNext = GameService.getInstance().createPassport(p1, 'GameRoom', p2, 'GameRoom');
    }

    // TODO - REFACTOR FOR GOD SAKE!!!
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
    }
}