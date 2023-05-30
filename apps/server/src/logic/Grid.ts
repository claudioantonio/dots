import Square from "./Square";
import Point from './Point';
import Edge from './Edge';
import { exception } from "console";



class Grid {
    squares: Square[] = [];
    gridPoints: Point[] = [];
    uniqueEdges: Edge[] = [];
    
    /**
     * Construtor
     * @param gridSize n. points (horizontal and vertical) for the grid
     */
    constructor(gridSize:number) {
        if (gridSize<2) {
            throw new Error("Grid size must be greater than 2");
        }
        this.createGridPoints(gridSize);
        this.createSquares(gridSize);
    }

    private createGridPoints(gridSize: number) {
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                this.gridPoints.push(new Point(x,y));
            }
        }
    }

    getTopLeftCorner(x:number,y:number,gridSize:number) {
        return (x*gridSize)+y;
    }

    getBottomLeftCorner(x:number,y:number,gridSize:number) {
        return (x*gridSize)+(y+1);
    }

    getBottomRightCorner(x:number,y:number,gridSize:number) {
        return (x+1)*gridSize+(y+1);
    }

    getTopRightCorner(x:number,y:number,gridSize:number) {
        return (x+1)*gridSize+y
    }

    getEdge(p1:Point,p2:Point) {
        let tempEdge:Edge = new Edge(p1,p2);
        for (let i = 0; i < this.uniqueEdges.length; i++) {
            const existingEdge = this.uniqueEdges[i];
            if (existingEdge.equals(tempEdge)) {
                return existingEdge;
            }
        }
        this.uniqueEdges.push(tempEdge);
        return tempEdge;
    }

    createEdges(x:number,y:number,gridSize:number){
        let leftEdge: Edge = this.getEdge(
            this.gridPoints[this.getTopLeftCorner(x,y,gridSize)],
            this.gridPoints[this.getBottomLeftCorner(x,y,gridSize)]
        );
        let bottomEdge: Edge = this.getEdge(
            this.gridPoints[this.getBottomLeftCorner(x,y,gridSize)],
            this.gridPoints[this.getBottomRightCorner(x,y,gridSize)]
        );
        let rightEdge: Edge = this.getEdge(
            this.gridPoints[this.getBottomRightCorner(x,y,gridSize)],
            this.gridPoints[this.getTopRightCorner(x,y,gridSize)]
        );
        let topEdge: Edge = this.getEdge(
            this.gridPoints[this.getTopRightCorner(x,y,gridSize)],
            this.gridPoints[this.getTopLeftCorner(x,y,gridSize)]    
        );
        let edges:Edge[] = [leftEdge,bottomEdge,rightEdge,topEdge];
        return edges;
    }

    createSquareId(x:number,y:number,gridSize:number) {
        return (gridSize-1)*x + y;
    }

    createSquares(gridSize:number) {
        for (let x = 0; x < (gridSize-1); x++) {
            for (let y = 0; y < (gridSize-1); y++) {
                console.log('CreateSquare #' + this.createSquareId(x,y,gridSize));
                let edges:Edge[]=this.createEdges(x,y,gridSize);
                this.squares.push(
                    new Square(
                        this.createSquareId(x,y,gridSize),
                        edges
                    )
                );
            }
        }
        console.log('createSquares - created #uniqueEdges=' + this.uniqueEdges.length);
    }

    /**
     * Rebuild the board game
     * Useful to restart a game or start a new game.
     * 
     * @param width Canvas width (TODO: Should not be in backend)
     * @param padding Space between grid points in canvas (TODO: Should not ne in backend)
     * @param height Canvas height (TODO: Should not be in backend)
     * @param gridSize Number of vertical and horizontal points in grid
     */
    reset(gridSize:number) {
        this.squares = [];
        this.gridPoints = [];
        this.createGridPoints(gridSize);
        this.createSquares(gridSize);
    }

    /**
     * Get squares that still have available edges
     * @param squareIds List of squares' ids
     */
    getAvailableSquaresbyId(squareIds:number[]):Square[] {
        let squaresFound:Square[] = [];
        for (let i = 0; i < this.squares.length; i++) {
            const currSquare = this.squares[i];
            squareIds.forEach(id => {
                if ((currSquare.id===id)&&(currSquare.hasAvailableFace())) {
                    squaresFound.push(currSquare);
                }
            });
            if (currSquare.id>squareIds[squareIds.length-1]) break;
        }
        return squaresFound;
    }

    /**
     * Close an edge
     *  
     * @param edge Edge to close 
     * @param owner User who wants to own the edge
     * 
     * @returns Number of closed squares by closing the edge provided.
     */
    conquerEdge(edge:Edge, owner:string) {
        let nClosedSquares:number=0;
        for (let i = 0; i < this.uniqueEdges.length; i++) {
            const gameEdge = this.uniqueEdges[i];
            if ((gameEdge.equals(edge))&&(!gameEdge.hasOwner())) {
                let squareIds:number[]=gameEdge.relatedSquareId;
                let availSquaresBeforeClosing:Square[]=this.getAvailableSquaresbyId(squareIds);
                gameEdge.setOwner(owner);
                let availSquaresAfterClosing:Square[]=this.getAvailableSquaresbyId(squareIds);
                nClosedSquares=availSquaresBeforeClosing.length-availSquaresAfterClosing.length;
                break;
            }
        }
        return nClosedSquares;
    }

    /**
     * Check if there is any open square.
     */
    hasOpenSquare() {
        for (let i = 0; i < this.squares.length; i++) {
            if (this.squares[i].hasAvailableFace()) {
                return true;
            }
        }
        return false;
    }
}

export default Grid;