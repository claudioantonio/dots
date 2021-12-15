import express from 'express';
import http from 'http';
import cors from 'cors';

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';


import SocketService from './service/SocketService';
import routes from './routes';

const SERVER_HTTP_PORT = process.env.PORT || 3333;
const CLIENT_HOST_SOCKETIO = process.env.CLIENT_HOST_SOCKETIO || 'http://localhost:3000';

const app = express();
const server = http.createServer(app);

// Config for socketio listening
SocketService.io.attach(server, {
    cors: {
        origin: CLIENT_HOST_SOCKETIO,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});
//--

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use(cors());
app.use(routes(SocketService));
app.set('socketio', SocketService.io); // Setting here to make avail at routes.ts

// Config for http REST listening
server.listen(SERVER_HTTP_PORT, () => console.log('Server running on port ' + SERVER_HTTP_PORT));
//--