class Point {
    x:number;
    y:number;

    constructor(x:number,y:number){
        this.x=x;
        this.y=y;
    }

    equals(other:Point) {
        let sameX:boolean = this.x==other.x;
        let sameY:boolean = this.y==other.y;
        return (sameX&&sameY)? true : false;
    }
}

export default Point;