import { Request, Response } from "express";
import { SocketService } from "../service/SocketService";

class PingController {

    handle(request: Request, response: Response) {
        console.log("PingController was called");
        try {
            const playerId: number = request.body.playerId;
            const socketId: string = request.body.socketId;

            SocketService.getInstance().registerPlayer(playerId, socketId);

            return response.sendStatus(201);
        } catch (e) {
            console.log(e);
            return response.status(400).json({
                error: 'PingController: Unexpected error while registering player and socket'
            });
        }
    }
}

export { PingController };