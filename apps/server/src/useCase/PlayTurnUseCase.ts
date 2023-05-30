import Edge from "../logic/Edge";
import { GameService } from "../service/GameService";
import { AbstractTurnUseCase } from "./AbstractTurnUseCase";

export class PlayTurnUseCase extends AbstractTurnUseCase {

    async execute(playerId: number, edge: Edge) {
        console.log("PlayTurnUseCase was called");

        GameService.getInstance().setPlayTime();
        let playResult = GameService.getInstance().get().play(playerId, edge);
        this.resultHandler(playResult);
    }
}