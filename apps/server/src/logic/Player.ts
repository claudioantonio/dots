/**
 * Models a player in the game
 */
class Player {
    id:number;
    name:string;
    score:number;

    constructor(id:number,name:string) {
        this.id=id;
        this.name=name;
        this.score=0;
    }

    updateScore(nClosedSquares:number) {
        if (nClosedSquares>0) {
            this.score+=nClosedSquares;
        }
    }

    reset() {
        this.score=0;
    }
}

export default Player;