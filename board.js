import Moves from "./moves.js";
import Utils from "./utils.js";

export const cols = ['A','B','C','D','E','F','G','H'];
export const rows = ['1','2','3','4','5','6','7','8'];
export const pieces = {};

// construct 2-way hash map with letters and ascii values
for(let i = 65; i <= 90; i++){
  pieces[i] = String.fromCharCode(i);
  pieces[String.fromCharCode(i)] = i;
};
for(let i = 97; i <= 122; i++){
  pieces[i] = String.fromCharCode(i);
  pieces[String.fromCharCode(i)] = i;
};

// unicode actually has chess characters, this maps it to the ascii number
export const unicodeCharMap = {
   [pieces.K]:"\u2654",
   [pieces.Q]:"\u2655",
   [pieces.R]:"\u2656",
   [pieces.B]:"\u2657",
   [pieces.N]:"\u2658",
   [pieces.P]:"\u2659",
   [pieces.k]:"\u265A",
   [pieces.q]:"\u265B",
   [pieces.r]:"\u265C",
   [pieces.b]:"\u265D",
   [pieces.n]:"\u265E",
   [pieces.p]:"\u265F",
}

class Board {

    positions = [];
    whiteKingMoved = false;
    blackKingMoved = false;
    A1RookMoved = false;
    A8RookMoved = false;
    H1RookMoved = false;
    H8RookMoved = false;

    constructor(){
        const board = new Uint8Array(64);
        //make  pawns
        for(let i = 8; i < 16; i++){
            board[i] = pieces.P;
            board[i+40] = pieces.p;
        }
    
        //make spaces
        for(let i = 16; i < 48; i++){
            board[i] = 0;
        }

        //make white pieces
        board[0] = pieces.R;
        board[7] = pieces.R;
        board[1] = pieces.N;
        board[6] = pieces.N;
        board[2] = pieces.B;
        board[5] = pieces.B;
        board[4] = pieces.K;
        board[3] = pieces.Q;
    
        //make black pieces
        board[0+56] = pieces.r;
        board[7+56] = pieces.r;
        board[1+56] = pieces.n;
        board[6+56] = pieces.n;
        board[2+56] = pieces.b;
        board[5+56] = pieces.b;
        board[4+56] = pieces.k;
        board[3+56] = pieces.q;

        this.current = board;
        this.positions.push([...board]);

        // make map to automatically call correct function based on index
        this.pieceMoveFunctionMap = {
            p: (index)=> Moves.pawn.getMoves(board, index),
            P: (index)=> Moves.pawn.getMoves(board, index),
            k: (index)=> Moves.king.getMoves(board, index),
            K: (index)=> Moves.king.getMoves(board, index),
            r: (index)=> Moves.rook.getMoves(board, index),
            R: (index)=> Moves.rook.getMoves(board, index),
            n: (index)=> Moves.knight.getMoves(board, index),
            N: (index)=> Moves.knight.getMoves(board, index),
            q: (index)=> Moves.queen.getMoves(board, index),
            Q: (index)=> Moves.queen.getMoves(board, index),
            b: (index)=> Moves.bishop.getMoves(board, index),
            B: (index)=> Moves.bishop.getMoves(board, index),
        };
    }

    whiteToMove(){
        return this.positions.length%2;
    }

    validateMove(indexA, indexB){
        const whiteToMove = this.whiteToMove();
        const piece = this.current[indexA];
        if(!piece){
            console.log("No piece at selected position.")
            return false;
        }
        if((whiteToMove && !Utils.isWhite(piece)) | (!whiteToMove && Utils.isWhite(piece))){
            console.log(whiteToMove ? "It is white's move" : "It is black's move");
            return false;
        }
        if(this.pieceMoveFunctionMap[pieces[piece]](indexA).includes(indexB) ){
            return true;
        }else{
            console.log("Not a valid move.")
            return false;
        }
    }

    move(indexA, indexB){
        if(this.validateMove(indexA, indexB)){
            this.current[indexB] = this.current[indexA];
            this.current[indexA] = 0;
            this.positions.push([...this.current]);
        }
        return this.current;
    }
}

export default Board;