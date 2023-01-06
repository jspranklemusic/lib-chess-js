import Utils from "./utils.js";
import Board, { cols, rows, pieces } from "./board.js";

// These all return the base moves without any special conditions (castle, check, en passant, etc.)q
class Moves { 
    static get(board, index, baseValues, moveConditions, attack){
        const moves = [];
        baseValues.forEach(newIndex=>{
            if(moveConditions(index, newIndex, board, attack)){
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
    // same as prev, but also grabs attacked pieces (for king move legality)
    static continueAttackMovesLoop(i, index, board, moves){
        moves.push(i);
        return board[i] == 0;
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
        moveConditions(index, newIndex, board, attack){
            const piece = board[index]
            return (
                Utils.inRange(newIndex) &&
                Utils.isEmptyAndInBounds(piece,board[newIndex],attack) &&
                Moves.checkDistance(index, newIndex, 1)
            );
        },
        getMoves(board,index,attack=false){
            const baseValues = this.baseValues(index);
            return Moves.get(board, index, baseValues, this.moveConditions, attack);
        }
    } 
    static queen = {
        getMoves(board,index,attack=false){
            return [
                ...Moves.bishop.getMoves(board,index,attack),
                ...Moves.rook.getMoves(board,index,attack)
            ]
        }
    }
    static rook = {
        getMoves(board,index,attack=false){
            const continueMoves = attack ? Moves.continueAttackMovesLoop : Moves.continueMovesLoop;
            const moves = [];
            //loop left
            for(let i = index-1; i >= index-(index%8);i--){
                if(!continueMoves(i, index, board, moves))
                    break;
            }
            //loop right
            for(let i = index + 1; i < index + (8 - index%8); i++){
                if(!continueMoves(i, index, board, moves))
                    break;
            }
            //loop up
            for(let i = index + 8; i <= (64 - (8 - (index%8)) ); i+=8){
                if(!continueMoves(i, index, board, moves))
                    break;
            }
            //loop down
            for(let i = index - 8; i >= 0+(index%8); i-=8){
                if(!continueMoves(i, index, board, moves))
                    break;
            }
            return moves;
        }
    }
    static bishop = {
        getMoves(board,index,attack=false){
            const continueMoves = attack ? Moves.continueAttackMovesLoop : Moves.continueMovesLoop;
            const moves = [];
            //loop top left
            for(let i = index + 7; (i-7)%8 > 0 && i < 63; i+=7){
                if(!continueMoves(i, index, board, moves))
                    break;
            }
            //loop top right
            for(let i = index + 9; (i-9)%8 < 7 && i < 64; i+=9){
                if(!continueMoves(i, index, board, moves))
                    break;
            }
            //loop bottom left
            for(let i = index - 9; (i+9)%8 > 0 && i >= 0; i-=9){
                if(!continueMoves(i, index, board, moves))
                    break;
            }
            //loop bottom right
            for(let i = index - 7; (i+7)%8 < 7 && i >= 0; i-=7){
                if(!continueMoves(i, index, board, moves))
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
        moveConditions(index, newIndex, board, attack){
            const piece = board[index]
            return (
                Utils.inRange(newIndex) &&
                Utils.isEmptyAndInBounds(piece,board[newIndex],attack) &&
                Moves.checkDistance(index, newIndex, 2)
            );
        },
        getMoves(board,index,attack=false){
            const baseValues = this.baseValues(index);
            return Moves.get(board, index, baseValues, this.moveConditions, attack);
        }
    }
    static pawn = {
        getMoves(board,index,attack=false){
            const moves = [];
            const sign = Utils.isWhite(board[index]) ? 1 : -1;
            const twoForward = 16*sign;
            const oneForward = 8*sign
            const diagLeft = sign > 0 ? 7 : -9;
            const diagRight = sign > 0 ? 9 : -7;
            const row2or7 = 3.5 - 2.5*sign;

            //if pawn is on row 2/7, give option of two moves
            if(!attack && Math.floor(index/8) == row2or7 && !board[index+twoForward] && !board[index+oneForward]){
                moves.push(index+twoForward);
            }
            //one up if empty
            if(!attack && index+oneForward < 64 && !board[index+oneForward] ){
                moves.push(index+oneForward);
            }
            //if isn't an A pawn, one up one left if enemy, or if getting attack squares
            if( index%8 > 0 && ((board[index+diagLeft] > 0 && !Utils.equalColors(board[index], board[index+diagLeft]) || attack) )){
                moves.push(index+diagLeft);
            }
            //if isn't an H pawn, one up one right if enemy, or if getting attack squares
            if( index%8 < 7 && ((board[index+diagRight] > 0 && !Utils.equalColors(board[index], board[index+diagRight])) || attack)){
                moves.push(index+diagRight);
            }
        
            return moves;
        }
    }
}

export default Moves;
