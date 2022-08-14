import Moves from "./moves.js";
import Utils from "./utils.js";

export const cols = ['A','B','C','D','E','F','G','H'];
export const rows = ['1','2','3','4','5','6','7','8'];
export const pieces = {};

window.pieces = pieces;

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

     // an array of all of the previous positions, starting from #1
    positions = [];
    // a copy of the default game position when it is setup
    default = []; 
    // for white castling legality
    whiteKingMoved = false; 
    A1RookMoved = false;
    H1RookMoved = false;
    // for black castling legality
    blackKingMoved = false; 
    A8RookMoved = false;
    H8RookMoved = false;
    // manually keep track of kings to avoid searching the board for checkmate
    whiteKingPosition = -1; 
    blackKingPosition = -1;
    // at the start of each turn, get all fo the current base moves for easier state checking
    currentAttackedSquares = [];
    currentLegalMoves = [];
    enPassantIndex = null;
    move50counter = 0;
    gameover = false;

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

        this.whiteKingPosition = 4;

        //make black pieces
        board[0+56] = pieces.r;
        board[7+56] = pieces.r;
        board[1+56] = pieces.n;
        board[6+56] = pieces.n;
        board[2+56] = pieces.b;
        board[5+56] = pieces.b;
        board[4+56] = pieces.k;
        board[3+56] = pieces.q;

        this.blackKingPosition = 4+56;

        // make map to automatically call correct function based on index
        this.pieceMoveFunctionMap = {
            k: (index,attack=false)=> Moves.king.getMoves(board, index, attack),
            K: (index,attack=false)=> Moves.king.getMoves(board, index, attack),
            p: (index,attack=false)=> Moves.pawn.getMoves(board, index, attack),
            P: (index,attack=false)=> Moves.pawn.getMoves(board, index, attack),
            r: (index,attack=false)=> Moves.rook.getMoves(board, index, attack),
            R: (index,attack=false)=> Moves.rook.getMoves(board, index, attack),
            n: (index,attack=false)=> Moves.knight.getMoves(board, index, attack),
            N: (index,attack=false)=> Moves.knight.getMoves(board, index, attack),
            q: (index,attack=false)=> Moves.queen.getMoves(board, index, attack),
            Q: (index,attack=false)=> Moves.queen.getMoves(board, index, attack),
            b: (index,attack=false)=> Moves.bishop.getMoves(board, index, attack),
            B: (index,attack=false)=> Moves.bishop.getMoves(board, index, attack),
        };

           // the 'this.current' variable is the current board position
           this.current = board;
           this.default = [...board];
           this.positions.push([...board]);
           this.setState();
    }

    // checks if white to move
    whiteToMove(){
        return this.positions.length%2;
    }
    
    // get the total number of base moves to find check/stalemate/checkmate
    getTotalBaseMoves(white=true){
        const moves = [];
        this.current.forEach((piece,i) => {
            if(piece > 0 && Utils.isWhite(piece) == white){
                moves.push([i,this.pieceMoveFunctionMap[pieces[piece]](i)]);
            }
        })
        return moves;
    }
    // return moves that aren't necessarily legal, but would prevent a king from moving into them
    getTotalAttackedSquares(isWhite=true){
        const moves = [];
        this.current.forEach((piece,i) => {
            if(piece > 0 && Utils.isWhite(piece) == isWhite){
                const thisAttackMoves = this.pieceMoveFunctionMap[pieces[piece]](i,true);
                moves.push(...thisAttackMoves);
            }
        })
        return moves;
    }

    // maybe come back and loop in reverse if black
    isCheck(){
        const whiteToMove = this.whiteToMove();
        const kingPosition = whiteToMove ? this.whiteKingPosition : this.blackKingPosition;
        for(let i = 0; i < this.current.length; i++){
            const piece = this.current[i];
            if(piece > 0 && Utils.isWhite(piece) != whiteToMove){
                const moves = this.pieceMoveFunctionMap[pieces[piece]](i,true);
                if(moves.includes(kingPosition)){
                    return true;
                }
            }
        }
        return false;
    }
    // check to see if kings moved from E1(4) or E8(60) by comparing current & default boards
    setKingsMoved(){
        if(!this.blackKingMoved && this.default[60] != this.current[60]){
            this.blackKingMoved = true;
        }
        else if(!this.whiteKingMoved && this.default[4] != this.current[4]){
            this.whiteKingMoved = true;
        }
    }

    // check to see if the rooks have moved by comparing the current & default boards
    setRooksMoved(){
        const rookSquares = [7,63,0,56]; //H1, H8, A1, A8
        rookSquares.forEach(index =>{
            if( !this[Utils.numToAlpha(index) +"RookMoved"] ){
                if(this.default[index] != this.current[index]){
                    this[Utils.numToAlpha(index) +"RookMoved"] = true;
                }
            }
        })
    }

    // returns an array of legal moves if a king can castle
    getCastleMoves(){
        const kingMoved = this.whiteToMove() ? this.whiteKingMoved : this.blackKingMoved;
        if(kingMoved) return [];
        const offset = this.whiteToMove() ? 0 : 56; 
        const rank = this.whiteToMove() ? "1" : "8";
        const moves = [];
        if( 
            !this[`H${rank}RookMoved`] && 
            !this.current[5+offset] &&
            !this.current[6+offset] && 
            !this.currentAttackedSquares.includes(5+offset) &&
            !this.currentAttackedSquares.includes(6+offset)
        ){
            moves.push(6+offset);
        }
        if(
            !this[`A${rank}RookMoved`] && 
            !this.current[3+offset] &&
            !this.current[2+offset] && 
            !this.current[1+offset] && 
            !this.currentAttackedSquares.includes(3+offset) &&
            !this.currentAttackedSquares.includes(2+offset)
        ){
            moves.push(2+offset);
        }
        
        return moves;
    }

    drawByRepetition(){
        let foundPositions = 0;
        this.positions.forEach(position => {
            if(position.every((value, index) => value === this.current[index])){
                foundPositions++;
            }
        })
        if(foundPositions >= 3){
            return true;
        }
    }

    // after a completed legal move, set the game state/variables for the next turn, check game-ending conditions
    setState(oldIndex, newIndex){
        this.setRooksMoved();
        this.setKingsMoved();
        const whiteToMove = this.whiteToMove();
        this.currentAttackedSquares = this.getTotalAttackedSquares(!whiteToMove);
        this.currentLegalMoves = this.getLegalMoves(whiteToMove);
        if(!this.currentLegalMoves.length){
            // find checkmate
            if(this.isCheck()){
                alert("checkmate!");
                this.gameover = true;
            // find stalemate
            }else{
                alert("stalemate");
                this.gameover = true;
            }
        }
        // find draw by 50 move
        if(this.move50counter >= 50){
            alert("draw by 50 move rule");
            this.gameover = true;
        }
        // find draw by 3 move repetition
        if(this.drawByRepetition()){
            alert("draw by repetition");
            this.gameover = true;
        }
    }

    // get additional, non-base legal moves such as castling and en passant
    appendAuxiliaryMoves(index,array){
        // castling
        if(index == this.whiteKingPosition | index == this.blackKingPosition){
            array.push(...this.getCastleMoves())
        }
        // en passant
        const pawn = this.whiteToMove() ? pieces.P : pieces.p;
        const offset = this.whiteToMove() ? 8 : -8;
        if(this.enPassantIndex && this.current[index] == pawn){
            if(index + 1 == this.enPassantIndex | index - 1 == this.enPassantIndex){
                array.push(this.enPassantIndex + offset);
            }
        }
    }

    // very slow - will need to do something else eventually when I write an AI. this also appends auxiliary moves
    getLegalMoves(){
        const moves = [];
        const movesWithIndex = this.getTotalBaseMoves(this.whiteToMove());
        movesWithIndex.forEach(array=>{
            const legal = array[1].filter(move=>this.tryMove(array[0],move));
            this.appendAuxiliaryMoves(array[0],legal)
            if(legal.length){
                moves.push([array[0],legal])
            }
        });
        return moves;
    }

    // make sure the move can proceed
    validateState(indexA, indexB){
        // find check
        return (
            !this.isCheck()
        )
    }

    // make sure that the basic move is legal for the piece
    validateBaseMove(indexA, indexB){
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
        return this.currentLegalMoves.find(arr=>arr[0] == indexA)[1]?.includes(indexB);
    }

    // this should not actually alter the state
    tryMove(indexA,indexB){
        const move1 = this.current[indexA];
        const move2 = this.current[indexB];
        this.current[indexB] = this.current[indexA];
        this.current[indexA] = 0;
        if(move1 == pieces.K){
            this.whiteKingPosition = indexB
        }
        else if(move1 == pieces.k){
            this.blackKingPosition = indexB
        }
        const stateValid = this.validateState();
        this.current[indexA] = move1;
        this.current[indexB] = move2;
        if(move1 == pieces.K){
            this.whiteKingPosition = indexA
        }
        else if(move1 == pieces.k){
            this.blackKingPosition = indexA
        }
        return stateValid;
    }

    // set en passant, rooks after castle, and pawn promotions.
    setAuxiliaryPieces(indexA, indexB, promotion){
        this.moveRook(indexA, indexB);
        this.promotePawn(indexA, indexB, promotion);
        this.enPassant(indexA, indexB);
    }

    // handles both setting (and reacting to) en passant   
    enPassant(indexA, indexB){
        const pawn = this.whiteToMove() ? pieces.P : pieces.p;
        const xOffset = this.whiteToMove() ? 8 : -8;
        if(this.current[indexA] == pawn){
            if( Math.abs(indexB - indexA) == 16){
                this.enPassantIndex = indexB;
                return;
            }
            else if(indexB - this.enPassantIndex == xOffset){
                this.current[this.enPassantIndex] = 0;
            }
            this.enPassantIndex = null;
        }
    }

    // after a legal castle, move the rooks beside the king
    moveRook(indexA, indexB){
        const offset = this.whiteToMove() ? 0 : 56;
        const king = offset ? pieces.k : pieces.K;
        if(this.current[indexA] == king && indexA == 4+offset){
            if(indexB == 6 + offset){
                this.current[5 + offset] = this.current[7 + offset];
                this.current[7 + offset] = 0;
            }else if(indexB == 2 + offset){
                this.current[3 + offset] = this.current[0 + offset];
                this.current[0 + offset] = 0;
            }
        }
    }

    // replaces the piece at indexA in place with the promoted one
    promotePawn(indexA, indexB, promotion){
        const pawn = this.whiteToMove() ? pieces.P : pieces.p;
        const offset = this.whiteToMove() ? 56 : 0;
        if(indexB >= (0 + offset) && indexB <= (7 + offset)){
            if(this.current[indexA] == pawn){
                this.current[indexA] = promotion
            }
        }
    }
    // check for a pawn move or a capture to reset to 0, otherwise increment by 1
    setMove50Counter(indexA, indexB){
        const conditions = ((
            this.current[indexB] > 0 && 
            Utils.equalColors(this.current[indexA],this.current[indexB])) | 
            (this.current[indexA] == pieces.P || 
            this.current[indexA] == pieces.p)
        );
        this.move50counter = conditions ? 0 : this.move50counter + 1;
    }

    // set the new piece position on the board, push it to the move history
    setPosition(indexA, indexB){
        this.current[indexB] = this.current[indexA];
        this.current[indexA] = 0;
        this.positions.push([...this.current]);
    }

    // this is async so that a player can promote a pawn if available
    async move(indexA, indexB, promotion = null){
        if(this.gameover) return;
        if(this.validateBaseMove(indexA, indexB)){
            if(this.tryMove(indexA,indexB)){
                this.setAuxiliaryPieces(indexA, indexB, promotion);
                this.setMove50Counter(indexA, indexB);
                this.setPosition(indexA,indexB);
                this.setState(indexA, indexB);
            }
        }
        return this.current;
    }
}

export default Board;