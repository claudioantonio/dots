import { Request, Response } from "express";
import Edge from "../logic/Edge";
import Point from "../logic/Point";
import { PlayTurnUseCase } from "../useCase/PlayTurnUseCase";
import { GameService } from "../service/GameService";

class TurnController {

    handle(request: Request, response: Response) {
        console.log('TurnController was called');

        const playerId: number = request.body.player;
        if (GameService.getInstance().get().getTurn() != playerId) {
            return response.status(400).json({
                'message': 'Play rejected because it´s not your turn',
            });
        }

        // TODO: Receive a better designed object to avoid processing on controller
        let edge: Edge = this.buildEdge(
            request.body.x1,
            request.body.y1,
            request.body.x2,
            request.body.y2
        );

        new PlayTurnUseCase().execute(playerId, edge);

        return response.sendStatus(201);
    }

    private buildEdge(rx1: any, ry1: any, rx2: any, ry2: any) {
        const x1: number = rx1;
        const y1: number = ry1;
        const x2: number = rx2;
        const y2: number = ry2;

        const p1: Point = new Point(x1, y1);
        const p2: Point = new Point(x2, y2);

        return new Edge(p1, p2);
    }
}

export { TurnController };