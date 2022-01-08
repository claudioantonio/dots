import express from 'express';
import http from 'http';
import cors from 'cors';

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

import { SocketService } from './service/SocketService';
import routes from './routes';

const SERVER_HTTP_PORT = process.env.PORT || 3333;
const CLIENT_HOST_SOCKETIO: string = process.env.CLIENT_HOST_SOCKETIO || 'http://localhost:3000';

const app = express();
const httpServer = http.createServer(app);

const socketService: SocketService = new SocketService(
    httpServer,
    () => { console.log("A user disconnected") },
    CLIENT_HOST_SOCKETIO
);

//app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(cors());
app.use(routes);

// Config for http REST listening
httpServer.listen(SERVER_HTTP_PORT, () => console.log('Server running on port ' + SERVER_HTTP_PORT));
//--