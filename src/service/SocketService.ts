import { Server, Socket } from "socket.io";

interface PlayerSocket {
    playerId: number,
    socketId: string
}

class SocketService {
    private static INSTANCE: SocketService;

    io: any;
    disconnectListener: Function | undefined;

    sockets: PlayerSocket[];

    constructor(httpServer: any, clientSocketHost: string) {
        this.io = new Server();

        this.setupCORS(httpServer, clientSocketHost);
        this.setupConnectionActions();

        this.sockets = [];

        SocketService.INSTANCE = this;
    }

    /**
     * Attach HTTP Server to SocketIO Server and configure CORS
     * 
     * @param httpServer 
     * @param clientSocketHost 
     */
    private setupCORS(httpServer: any, clientSocketHost: string): void {
        this.io.attach(httpServer, {
            cors: {
                origin: clientSocketHost,
                methods: ["GET", "POST"],
                allowedHeaders: ["my-custom-header"],
                credentials: true
            }
        });
    }

    private setupConnectionActions() {
        this.io.on("connection", (socket: SocketIO.Socket) => {
            console.log("New Socket.io client connected");

            socket.on("disconnect", () => {
                console.log("Socket ", socket.id, " disconnected");
                const unregisteredPlayerId = this.unregisterPlayer(socket.id);
                if (this.disconnectListener) {
                    this.disconnectListener(unregisteredPlayerId);
                }
            });
        });
    }

    static getInstance(): SocketService {
        if (!SocketService.INSTANCE) {
            throw new Error("SocketService was not initialized!");
        }
        return SocketService.INSTANCE;
    }

    public broadcastMessage(name: string, messageObj: any) {
        this.io.emit(name, messageObj);
    }

    public setDisconnectionListener(listener: Function) {
        this.disconnectListener = listener;
    }

    public registerPlayer(playerId: number, socketId: string) {
        const player: PlayerSocket = { playerId, socketId };
        this.sockets.push(player);
        console.log('Registered sockets=', this.sockets);
    }

    public unregisterPlayer(socketId: string): number {
        let newSockets: PlayerSocket[] = [];
        let unregisterPlayerId;
        this.sockets.forEach(player => {
            if (player.socketId != socketId) {
                newSockets.push(player);
            } else {
                unregisterPlayerId = player.playerId;
            }
        });
        this.sockets = newSockets;
        if (!unregisterPlayerId) throw new Error('Socket for player to be disconnected was not found');
        console.log('Registered sockets=', this.sockets);
        return unregisterPlayerId;
    }
}

export { SocketService };