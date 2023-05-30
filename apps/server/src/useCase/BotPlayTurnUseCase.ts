import BotPlayer from "../logic/BotPlayer";
import { GameService } from "../service/GameService";
import { AbstractTurnUseCase } from "./AbstractTurnUseCase";

export class BotPlayTurnUseCase extends AbstractTurnUseCase {

    async execute() {
        console.log("BotPlayTurnUseCase was called");

        GameService.getInstance().setPlayTime();
        const botPlayer: BotPlayer = GameService.getInstance().get().players[0] as BotPlayer;
        let playResult = botPlayer.play(GameService.getInstance().get());
        this.resultHandler(playResult);
    }
}