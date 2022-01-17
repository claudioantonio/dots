import BotPlayer from './BotPlayer';
import Edge from './Edge';
import Grid from './Grid';
import Player from './Player';


const GRID_SIZE = 6;
const MAX_PLAYERS = 2;

const PLAYER1: number = 0;
const PLAYER2: number = 1;

const BOTPLAYER_ID: number = 0;

const STATUS_NOT_READY: number = 1;
const STATUS_READY: number = 2;
const STATUS_IN_PROGRESS: number = 3;
const STATUS_OVER: number = 4;
const STATUS_OVER_BY_DRAW: number = 5;

/**
 * Class to model the territory game
 */
class Game {
    board: Grid;
    status: number = STATUS_NOT_READY;
    players: Player[] = [];
    turn: number = PLAYER1; // Player1 starts the game by default
    startTimestamp: number = -1;
    lastPlay: Edge | undefined;
    lastPlayTimestamp: number = -1;
    message: string = "";


    constructor() {
        this.board = new Grid(GRID_SIZE);
    }

    isBotGame() {
        return (this.players[PLAYER1].id === BOTPLAYER_ID) ? true : false;
    }

    isReady() {
        return (this.status == STATUS_READY) ? true : false;
    }

    isInProgress() {
        return (this.status == STATUS_IN_PROGRESS) ? true : false;
    }

    isOver() {
        return (this.status == STATUS_OVER || this.status == STATUS_OVER_BY_DRAW) ? true : false;
    }

    isOverByDraw() {
        return (this.status == STATUS_OVER_BY_DRAW) ? true : false;
    }

    getStatus() {
        return this.status;
    }

    canAddPlayer() {
        return this.players.length < MAX_PLAYERS ? true : false;
    }

    addPlayer(player: Player) {
        if (!this.canAddPlayer()) return -1;

        this.players.push(player);

        if (this.players.length == MAX_PLAYERS) this.status = STATUS_READY;

        console.log('Game: User ' + player.name + ' was registered');
        return;
    }

    /**
     * Change turn to the next player
     */
    updateTurn() {
        this.turn = (this.turn == PLAYER1) ? PLAYER2 : PLAYER1;
    }

    /**
     * Return the id of the player for the current
     */
    getTurn() {
        return this.players[this.turn].id;
    }

    // TODO Include score in Player class
    // TODO return Player class instead of individual attrs
    getGameSetup() {
        let setup = {
            gridsize: GRID_SIZE,
            player1Id: this.players[PLAYER1].id,
            player1: this.players[PLAYER1].name,
            player2: this.players[PLAYER2].name,
            score_player1: this.players[PLAYER1].score,
            score_player2: this.players[PLAYER2].score,
            turn: this.getTurn(),
            gameOver: (this.isOver()),
        };
        return setup;
    }

    getGameInfo() {
        let info = {
            player1Id: this.players[PLAYER1].id,
            score_player1: this.players[PLAYER1].score,
            score_player2: this.players[PLAYER2].score,
            lastTurn: this.turn === PLAYER1 ? this.players[PLAYER2].id : this.players[PLAYER1].id,
            lastPlay: this.lastPlay,
            gameOver: this.isOver(),
            whatsNext: {}, // Instructions when game is over
            turn: this.getTurn(),
            message: this.message,
        };
        console.log(info);
        return info;
    }

    getMessage() {
        if (this.status == STATUS_OVER_BY_DRAW) {
            return 'You both tied in the game!';
        } else {
            const winner = this.getWinner();
            return (winner!.name + ' won!!!');
        }
    }

    getLooser() {
        let winner = this.getWinner();
        if (this.players[PLAYER1].id === winner!.id) {
            return this.players[PLAYER2];
        } else {
            return this.players[PLAYER1];
        }
    }

    getWinner() {
        let diffPoints: number = this.players[PLAYER1].score - this.players[PLAYER2].score;

        if (diffPoints === 0) {
            return null;
        } else if (diffPoints < 0) {
            return this.players[PLAYER2];
        } else {
            return this.players[PLAYER1];
        }
    }

    // TODO Is it the best way to locate the player?
    getPlayerIndex(playerId: number) {
        let result: number = 0;
        this.players.forEach((player, index) => {
            if (playerId == player.id) {
                result = index;
            }
        });
        return result;
    }

    getBoard() {
        return this.board;
    }

    getStartTimestamp() {
        return this.startTimestamp;
    }

    getLastPlayTimestamp() {
        return this.lastPlayTimestamp;
    }

    updateStatus() {
        if (this.board.hasOpenSquare() == false) {
            this.status = (this.getWinner() == null) ? STATUS_OVER_BY_DRAW : STATUS_OVER;
            this.message = this.getMessage();
        }
    }

    play(playerId: number, edge: Edge) {
        if (this.status === STATUS_READY) {
            this.status = STATUS_IN_PROGRESS;
            this.startTimestamp = (new Date()).getTime();
        }
        this.lastPlay = edge;
        this.lastPlayTimestamp = (new Date()).getTime();

        const playerIndex = this.getPlayerIndex(playerId);
        const player = this.players[playerIndex];

        const nClosedSquares = this.board.conquerEdge(edge, player.name);
        player.updateScore(nClosedSquares);

        this.updateStatus();
        this.updateTurn();
        return this.getGameInfo();
    }

    /**
     * Force a game to end
     * Used when a player disconnects during a game
     */
    forceGameOver() {
        this.status = STATUS_OVER;
    }

    /**
     * Prepare a new game
     * TODO Do botplayer always need to be player1?
     * @param p1 Player 1
     * @param p2 Player 2
     */
    newGame(p1: Player, p2: Player) {
        this.reset();
        p1.reset();
        p2.reset();
        if (p1 instanceof BotPlayer) { // Player1 will be the bot
            this.addPlayer(p1);
            this.addPlayer(p2);
        } else if (p2 instanceof BotPlayer) { //Player1 will be the bot
            this.addPlayer(p2);
            this.addPlayer(p1);
        } else { // Player1 will be the last game winner
            this.addPlayer(p1);
            this.addPlayer(p2);
        }
    }

    /**
     * Reset a game.
     * Useful to restart a game or start a new game.
     * 
     * @param gridSize Number of vertical and horizontal points in grid
     */
    reset() {
        this.board = new Grid(GRID_SIZE);
        this.status = STATUS_NOT_READY;
        this.players = [];
        this.turn = PLAYER1;
        this.startTimestamp = -1;
        this.lastPlayTimestamp = -1;
        this.message = "";
    }
}

export default Game;