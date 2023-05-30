import Point from './Point';
import Square from './Square';

class Edge {
    initialPoint:Point;
    endPoint:Point;
    relatedSquareId:number[]=[];
    owner:string = "";

    constructor(p1:Point,p2:Point){
        this.initialPoint=p1;
        this.endPoint=p2;
    }

    setOwner(owner:string) {
        if (!this.hasOwner()) {
            this.owner=owner;
        }
    }

    hasOwner() {
        return (this.owner.length>0)? true : false;       
    }

    equals(other:Edge){
        let sameInitial:boolean = this.initialPoint.equals(other.initialPoint);
        let sameEnd:boolean = this.endPoint.equals(other.endPoint);
        if ((sameInitial)&&(sameEnd)) {
            console.log('Edge - equals - Achou edge na ordem original');
            return true;
        }
        sameInitial = this.initialPoint.equals(other.endPoint);
        sameEnd = this.endPoint.equals(other.initialPoint);
        if ((sameInitial)&&(sameEnd)) {
            console.log('Edge - equals - Achou edge na ordem inversa');
            return true;
        }
        return false;
    }

    relatesTo(squareId: number) {
        this.relatedSquareId.push(squareId);
    }

    getRelatedSquareOtherThan(id: number): number {
        if (this.relatedSquareId[0]===id) {
            return this.relatedSquareId[1];
        } else {
            return this.relatedSquareId[0];
        }
    }
}

export default Edge;