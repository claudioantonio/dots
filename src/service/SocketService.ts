import { Server, Socket } from "socket.io";

class SocketService {
    private static INSTANCE: SocketService;

    io: any;
    disconnectListener: Function;

    constructor(httpServer: any, disconnectListener: Function, clientSocketHost: string) {
        this.io = new Server();
        this.disconnectListener = disconnectListener;

        this.setupCORS(httpServer, clientSocketHost);
        this.setupConnectionActions();

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
                this.disconnectListener();
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
}

export { SocketService };