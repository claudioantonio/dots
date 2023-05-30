import Edge from "./Edge";
import Game from "./Game";
import Grid from "./Grid";
import Player from "./Player";
import Square from "./Square";

const BOTPLAYER_ID:number = 0;
const BOTPLAYER_NAME:string = "Bot";

/**
 * Models a bot player to allow a 1 player game
 */
class BotPlayer extends Player{
    
    constructor() {
        super(BOTPLAYER_ID,BOTPLAYER_NAME);
    }

    /**
     * Execute a bot move in the gameboard
     * @param game Gameboard
     */
    play(game:Game) {
        const board:Grid = game.getBoard();
        let edge = this.findSquareReadyToClose(board);
        if (edge==null) {
            edge = this.findFirstAvailableEdge(board);
        }
        return game.play(this.id,edge!); //Edge is not null at this point
    }

    /**
     * Find first available edge to move but try not give a point
     * to player 2.
     * If its not possible to find an edge like that, choose the first
     * which is available.
     * @param board Gameboard
     */
    findFirstAvailableEdge(board: Grid) {
        console.log('FindFirstAvailableEdge')
        let anyAvailEdge=null;
        let bestEdge=null;
        for (let i = 0; i < board.squares.length; i++) {
            const square = board.squares[i];
            if (square.hasAvailableFace()) {
                bestEdge = this.getBestEdge(square,board.squares);
                if (bestEdge==null) {
                    anyAvailEdge = this.getFirstAvailableEdge(square);
                } else {
                    return bestEdge;
                }    
            }
        }
        return anyAvailEdge;   
    }

    getBestEdge(square:Square, allSquares:Square[]) {
        console.log('--- BotPlayer - getBestEdge');
        if (square.getNumberOfAvailableFaces()>2) {
            let availEdge = this.getAvailableEdges(square);
            for (let i = 0; i < availEdge.length; i++) {
                const edge = availEdge[i];
                if (edge.relatedSquareId.length>1) { // Shared edge
                    console.log('--- BotPlayer - getBestEdge - shared edge was found');
                    let otherSquareId:number=edge.getRelatedSquareOtherThan(square.id);
                    if ( (otherSquareId>square.id) &&
                         (allSquares[otherSquareId].getNumberOfAvailableFaces()>2)) {
                            return edge;
                    }
                } else { // Not shared edge
                    console.log('--- BotPlayer - getBestEdge - Not shared edge was found');
                    return edge;
                }
            }
        }
        return null;
    }

    getAvailableEdges(square:Square) {
        let availEdges:Edge[]=[];
        for (let i = 0; i < square.edges.length; i++) {
            const currEdge= square.edges[i];
            if (!currEdge.hasOwner()) {
                availEdges.push(currEdge);
            }
        }
        return availEdges;
    }

    /**
     * Find an edge which closes an square, or return null otherwise
     * @param board Gameboard
     */
    findSquareReadyToClose(board:Grid) {
        for (let i = 0; i < board.squares.length; i++) {
            const square = board.squares[i];
            let edge = (square.getNumberOfAvailableFaces()===1)? this.getFirstAvailableEdge(square) : null;
            if (edge!=null) {
                return edge;
            }
        }
        return null;
    }

    /**
     * Returns the first available in the given square
     * @param square A square in the gameboard
     */
    getFirstAvailableEdge(square:Square) {
        for(let i=0; i<square.edges.length; i++) {
            if (!square.edges[i].hasOwner()) {
                return square.edges[i];
            }
        }
        return null;
    }
}

export default BotPlayer;