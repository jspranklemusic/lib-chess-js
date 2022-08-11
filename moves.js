import Utils from "./utils.js";
import Board, { cols, rows, pieces } from "./board.js";

// These all return the base moves without any special conditions (castle, check, en passant, etc.)
class Moves {
    static get(board, index, baseValues, moveConditions){
        const moves = [];
        baseValues.forEach(newIndex=>{
            if(moveConditions(index, newIndex, board)){
                moves.push(newIndex)
            }
        })
        return moves;
    }
    static checkDistance(posA, posB, distance = 2){
        const colCurrent = Utils.getCol(posA);
        const colNew = Utils.getCol(posB);
        return Utils.inRange(posB) && Math.abs(colNew - colCurrent) <= distance
    }

    // adds move if valid and returns true to continue, false to break loop
    static continueMovesLoop(i, index, board, moves){
        //square is empty
        if(!board[i]){
            return moves.push(i);
        }else {
             //it's occupied with enemy piece, add move and then break
            if( !Utils.equalColors(board[i], board[index]) ){
                moves.push(i)
            }  //it's occupied with friendly piece
            return false;
        }
    }
    static king = {
        baseValues(index){
            return [
                index+7, //up 1, left 1
                index+8, //up 1
                index+9, //up 1, right 1
                index+1, //right 1
                index-7, //down one right 1
                index-8, //down one
                index-9, //down one, left one
                index-1  //left one
            ];
        },
        moveConditions(index, newIndex, board){
            const piece = board[index]
            return (
                Utils.inRange(newIndex) &&
                Utils.isEmptyAndInBounds(piece,board[newIndex]) &&
                Moves.checkDistance(index, newIndex, 1)
            );
        },
        getMoves(board,index){
            const baseValues = this.baseValues(index);
            return Moves.get(board, index, baseValues, this.moveConditions);
        }
    } 
    static queen = {
        getMoves(board,index){
            return [
                ...Moves.bishop.getMoves(board,index),
                ...Moves.rook.getMoves(board,index)
            ]
        }
    }
    static rook = {
        getMoves(board,index){
            const moves = [];
            //loop left
            for(let i = index-1; i >= index-(index%8);i--){
                if(!Moves.continueMovesLoop(i, index, board, moves))
                    break;
            }
            //loop right
            for(let i = index + 1; i < index + (8 - index%8); i++){
                if(!Moves.continueMovesLoop(i, index, board, moves))
                    break;
            }
            //loop up
            for(let i = index + 8; i <= (64 - (8 - (index%8)) ); i+=8){
                if(!Moves.continueMovesLoop(i, index, board, moves))
                    break;
            }
            //loop down
            for(let i = index - 8; i >= 0+(index%8); i-=8){
                if(!Moves.continueMovesLoop(i, index, board, moves))
                    break;
            }
            return moves;
        }
    }
    static bishop = {
        getMoves(board,index){
            const moves = [];
            //loop top left
            for(let i = index + 7; (i-7)%8 > 0 && i < 63; i+=7){
                if(!Moves.continueMovesLoop(i, index, board, moves))
                    break;
            }
            //loop top right
            for(let i = index + 9; (i-9)%8 < 7 && i < 64; i+=9){
                if(!Moves.continueMovesLoop(i, index, board, moves))
                    break;
            }
            //loop bottom left
            for(let i = index - 9; (i+9)%8 > 0 && i >= 0; i-=9){
                if(!Moves.continueMovesLoop(i, index, board, moves))
                    break;
            }
            //loop bottom right
            for(let i = index - 7; (i+7)%8 < 7 && i >= 0; i-=7){
                if(!Moves.continueMovesLoop(i, index, board, moves))
                    break;
            }
            return moves;
        }
    }
    static knight = {
        baseValues(index){
            return [
                (index + 16) - 1, //up 2, left 1
                (index + 16) + 1, //up 2, right 1
                (index - 16) - 1, //down 2, left 1,
                (index - 16) + 1, //down 2, right 1
                (index - 2) + 8,  //left 2, up 1
                (index - 2) - 8,  //left 2, down 1
                (index + 2) + 8,  //right 2, up 1
                (index + 2) - 8   //right 2, left 1
            ]
        },
        moveConditions(index, newIndex, board){
            const piece = board[index]
            return (
                Utils.inRange(newIndex) &&
                Utils.isEmptyAndInBounds(piece,board[newIndex]) &&
                Moves.checkDistance(index, newIndex, 2)
            );
        },
        getMoves(board,index){
            const baseValues = this.baseValues(index);
            return Moves.get(board, index, baseValues, this.moveConditions);
        }
    }
    static pawn = {
        getMoves(board,index){
            const moves = [];
            const sign = Utils.isWhite(board[index]) ? 1 : -1;
            const twoForward = 16*sign;
            const oneForward = 8*sign
            const diagLeft = 7*sign;
            const diagRight = 9*sign;
            const row2or7 = 3.5 - 2.5*sign;

            //if pawn is on row 2/7, give option of two moves
            if(Math.floor(index/8) == row2or7 && !board[index+twoForward]){
                moves.push(index+twoForward);
            }
            //one up if empty
            if( index+oneForward < 64 && !board[index+oneForward] ){
                moves.push(index+oneForward);
            }
            //if isn't an A pawn, one up one left if enemy
            if( index%8 < 7 && board[index+diagLeft] > 0 && !Utils.equalColors(board[index], board[index+diagLeft])){
                moves.push(index+diagLeft);
            }
            //if isn't an H pawn, one up one right if enemy
            if( index%8 > 1 && board[index+diagRight] > 0 && !Utils.equalColors(board[index], board[index+diagRight])){
                moves.push(index+diagRight);
            }
        
            return moves;
        }
    }
}

export default Moves;





