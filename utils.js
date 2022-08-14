import { cols, rows, pieces } from "./board.js";

class Utils {
    // returns a coordinate (e.g. 'C7') from an index
    static numToAlpha(num){
        return cols[this.getCol(num)] + rows[this.getRow(num)];
    }

    // 0 - 7
    static getCol(num){
        return num%8;
    }

    // 0 - 7
    static getRow(num){
        return (((num - (num%8))+8)/8 - 1);
    }

    // returns an index from a coordinate (e.g. 'A2'). ASCII letters A-H are 65-72, numbers 1-8 are 49-57
    static alphaToNum(alpha){
        return (alpha.charCodeAt(0) - 64)+( (alpha.charCodeAt(1)-49)*8 ) - 1;
    }

    // checks if the position is on the board
    static inRange(pos){
        return (pos < 64 && pos >= 0);
    }

    // checks if white. upper case is white, lower case (90 ASCII and above) is black
    static isWhite(piece){
        return piece >= 65 && piece < 90 ;
    }

    // returns true if a square is in bounds and empty/capturable
    static isEmptyAndInBounds(oldSquare, newSquare, attack){
        return (
            newSquare != undefined &&
            newSquare == 0 |
            !this.equalColors(oldSquare, newSquare) |
            !!attack
        );
    }

    // checks if two squares are the same
    static equalColors(oldSquare, newSquare) {
        return (this.isWhite(oldSquare) == this.isWhite(newSquare))
    }

    // prints coordinates pretty
    static pretty(arr){
        return arr.map(square=> Utils.numToAlpha(square))
    }
}

export default Utils;