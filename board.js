import Moves from "./moves.js";
import Utils from "./utils.js";

export const cols = ['A','B','C','D','E','F','G','H'];
export const rows = ['1','2','3','4','5','6','7','8'];

// output of the 2-way hash map function - for type inference
export const pieces = {
    66: "B",
    75: "K",
    78: "N",
    80: "P",
    81: "Q",
    82: "R",
    98: "b",
    107: "k",
    110: "n",
    112: "p",
    113: "q",
    114: "r",
    B: 66,
    K: 75,
    N: 78,
    P: 80,
    Q: 81,
    R: 82,
    b: 98,
    k: 107,
    n: 110,
    p: 112,
    q: 113,
    r: 114
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
    // at the start of each turn, get all fo the LEGAL moves and attacked squares for easier state checking
    currentAttackedSquares = [];
    currentLegalMoves = [];
    enPassantIndex = null;
    move50counter = 0;
    gameover = false;
    winner = "";
    currentIndex = 0;
    pgnMoves = [] // moves in algebraic notation
    moves = [] // moves in index format

    constructor(config={fen: null, pgn: null}){
        const board = new Uint8Array(64);
        window.board = this;
        //make  pawns
        for(let i = 8; i < 16; i++){
            board[i] = pieces.P;
            board[i+40] = pieces.p;
        }
    
        //make spaces
        for(let i = 16; i < 48; i++){
            board[i] = 0;
        }

        if (config.fen) {

        } else {
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
        }

       

        // make map to automatically call correct function based on index
        this.pieceMoveFunctionMap = {
            k: (index,attack=false, position = null)=> Moves.king.getMoves(position ? position : board, index, attack),
            K: (index,attack=false, position = null)=> Moves.king.getMoves(position ? position : board, index, attack),
            p: (index,attack=false, position = null)=> Moves.pawn.getMoves(position ? position : board, index, attack),
            P: (index,attack=false, position = null)=> Moves.pawn.getMoves(position ? position : board, index, attack),
            r: (index,attack=false, position = null)=> Moves.rook.getMoves(position ? position : board, index, attack),
            R: (index,attack=false, position = null)=> Moves.rook.getMoves(position ? position : board, index, attack),
            n: (index,attack=false, position = null)=> Moves.knight.getMoves(position ? position : board, index, attack),
            N: (index,attack=false, position = null)=> Moves.knight.getMoves(position ? position : board, index, attack),
            q: (index,attack=false, position = null)=> Moves.queen.getMoves(position ? position : board, index, attack),
            Q: (index,attack=false, position = null)=> Moves.queen.getMoves(position ? position : board, index, attack),
            b: (index,attack=false, position = null)=> Moves.bishop.getMoves(position ? position : board, index, attack),
            B: (index,attack=false, position = null)=> Moves.bishop.getMoves(position ? position : board, index, attack),
        };

           // the 'this.current' variable is the current board position
           this.current = board;
           this.default = [...board];
           this.positions.push([...board]);
           this.setState();

           if (config.pgn) {
            this.parseGameFromPGN(config.pgn)
           }
    }
    
    // parse game from PGN
    parseGameFromPGN(pgn) {
        // pgn can be either array of move strings, or a string from a proper PGN file
        if (Array.isArray(pgn)) {
            pgn.forEach(strMove => {
                const indexMove = this.indexMoveFromPGN(strMove);
                this.move(...indexMove)
            })
        } else {
            console.log(pgn)
        }
    }

    // checks if white to move
    whiteToMove(){
        return this.positions.length%2;
    }
    
    // get the total number of base moves to find check/stalemate/checkmate
    getTotalBaseMoves(isWhite=true, positionIndex = -1){
        const moves = [];
        const position = positionIndex < 0 ? this.current : this.positions[positionIndex];
        position.forEach((piece,i) => {
            if(piece > 0 && Utils.isWhite(piece) == isWhite){
                moves.push([i,this.pieceMoveFunctionMap[pieces[piece]](i, false, position)]);
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

    // loops through enemy attacked squares to see if they include the king position
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
        }else if(!this.whiteKingMoved && this.default[4] != this.current[4]){
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

    // display the board

    prettyPrint(board){
        let printStr = ''
        for (let j = 0; j < 64; j++) {
            let i = 63 - j;
            printStr += ' '
            if (unicodeCharMap[board[i]]) {
                printStr += unicodeCharMap[board[i]]
            } else {
                const col = Utils.getCol(i);
                const row = Utils.getRow(i);
                console.log({col, row , i})
                if ((col%2)) {
                    if (!(row%2)) {
                        printStr += '#'

                    } else {
                        printStr += '_'
                    }
                } else {
                    if (!(row%2)) {
                        printStr += '_'

                    } else {
                        printStr += '#'
                    }
                }
            }
            if (!(i%8)) {
                printStr += '\n';
            }
        }
        console.log(printStr);
    }

    // resign the position, make your opponent win
    resign(isWhite){
        this.gameover = "resigned";
        this.winner = isWhite ? "black" : "white";
    }

    // after a completed legal move, set the game state/variables for the next turn, check game-ending conditions
    setState(){
        this.setRooksMoved();
        this.setKingsMoved();
        const whiteToMove = this.whiteToMove();
        this.currentAttackedSquares = this.getTotalAttackedSquares(!whiteToMove);
        this.currentLegalMoves = this.getLegalMoves();
        if(!this.currentLegalMoves.length){
            // find checkmate
            if(this.isCheck()){
                this.gameover = "checkmate"
            // find stalemate
            }else{
                this.gameover = "stalemate";
            }
        }
        // find draw by 50 move
        else if(this.move50counter >= 50){
            this.gameover = "fifty_move_rule";
        }
        // find draw by 3 move repetition
        else if(this.drawByRepetition()){
            this.gameover = "draw_by_repetition"
        }
        if(this.gameover){
            console.log(this.gameover)
        };
        this.currentIndex = this.positions.length - 1;
    }

    // get additional, non-base legal moves such as castling and en passant
    appendAuxiliaryMoves(index,array,whiteToMove = null){
        if (whiteToMove == null) {
            whiteToMove = this.whiteToMove();
        }
        // castling
        if(index == this.whiteKingPosition | index == this.blackKingPosition){
            array.push(...this.getCastleMoves())
        }
        // en passant
        const pawn = whiteToMove ? pieces.P : pieces.p;
        const offset = whiteToMove ? 8 : -8;
        if(this.enPassantIndex && this.current[index] == pawn){
            if(index + 1 == this.enPassantIndex | index - 1 == this.enPassantIndex){
                array.push(this.enPassantIndex + offset);
            }
        }
    }

    // very slow - will need to do something else eventually when I write an AI. this also appends auxiliary moves
    getLegalMoves(positionIndex = -1, whiteToMove = null){
        const moves = [];
        if (whiteToMove == null) {
            whiteToMove = this.whiteToMove();
        }
        const movesWithIndex = this.getTotalBaseMoves(whiteToMove, positionIndex);
        if (positionIndex >= 0) {
            console.log({movesWithIndex})
        }
        movesWithIndex.forEach(array=>{
            const legal = array[1].filter(move=>this.tryMove(array[0], move, positionIndex));
            this.appendAuxiliaryMoves(array[0], legal, whiteToMove);
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

    // this tests if the move is valid
    tryMove(indexA, indexB, posIndex = - 1){
        const position = posIndex < 0 ? this.current : this.positions[posIndex];
        const move1 = position[indexA];
        const move2 = position[indexB];
        position[indexB] = position[indexA];
        position[indexA] = 0;
        if(move1 == pieces.K){
            this.whiteKingPosition = indexB
        }
        else if(move1 == pieces.k){
            this.blackKingPosition = indexB
        }
        const stateValid = this.validateState();
        position[indexA] = move1;
        position[indexB] = move2;
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
        this.setEnPassant(indexA, indexB);
    }

    // handles both getting and setting en passant   
    setEnPassant(indexA, indexB){
        const whiteToMove = this.whiteToMove();
        const pawn = whiteToMove ? pieces.P : pieces.p;
        const xOffset = whiteToMove ? 8 : -8;
        if(this.current[indexA] == pawn){
            // OK, I think the en passant bug is here, I need to check if there's an enemy pawn (in bounds) that's one index away
            if(Math.abs(indexB - indexA) == 16){
                this.enPassantIndex = indexB;
                return;
            }
            // if the move is en passant, remove the enemy piece from the board
            else if(indexB - this.enPassantIndex == xOffset){
                this.current[this.enPassantIndex] = 0;
            }
        }
        this.enPassantIndex = null;
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

    isCheckmate() {
        return this.currentLegalMoves.length == 0 && this.isCheck()
    }

    wasEnPassantCapture(index, prev, curr){
        return (
            (prev[index - 1] && !curr[index - 1]) ||
            (prev[index + 1] && !curr[index + 1])
        )
    }

    appendPGN(indexA, indexB) {
        const [prev, curr] = this.positions.slice(-2);
        const oldMove = prev[indexA];
        const oldMoveNewSqr = prev[indexB];
        const newMove = curr[indexB];
        const newSquareAlpha = Utils.numToAlpha(indexB).toLowerCase();
        const oldSquareAlpha = Utils.numToAlpha(indexA).toLowerCase();
        const isWhite = !(this.positions.length%2)
        
        let pgnMove = (pieces[oldMove] + '').toUpperCase();

        // check for conflicts, clarify by adding row number or column name
        const prevLegalMoves = this.getLegalMoves(this.positions.length - 2, isWhite);
        const piecesCanMoveToSquare = [];
        prevLegalMoves.forEach(move => {
            const moves =  move.slice(1).flat()
            if (moves.includes(indexB)) {
                piecesCanMoveToSquare.push(move[0])
            }
        })
        if (piecesCanMoveToSquare.length > 1) {
            for (let i = 0; i < piecesCanMoveToSquare.length; i++) {
                const index = piecesCanMoveToSquare[i];
                if (prev[index] == prev[indexA] && index != indexA) {
                    pgnMove += oldSquareAlpha
                    break;
                }
            }
        }

        // capturing or en passant
        if (pieces[oldMoveNewSqr] || this.wasEnPassantCapture(indexA, prev, curr)) {
            if (pgnMove[0] == 'P') {
                pgnMove += oldSquareAlpha[0];
            } 
            pgnMove += 'x';
        }

        pgnMove += newSquareAlpha;
        // if castling
        if (pgnMove[0] == 'K') {
            // do O-O
            if (indexB == indexA + 2) {
                pgnMove = 'O-O'
            } else if (indexB == indexA - 2) {
                pgnMove = 'O-O-O'
            }
         } 
        //  pawn moves
        if (pgnMove[0] == 'P') {
            pgnMove = pgnMove.slice(1)
            const row = Utils.getRow(indexB);
            // promotion
            if (row == 7 || row == 0) {
                pgnMove += '=' + pieces[newMove].toUpperCase();
            }
        }
        // checkmate
        if (this.isCheckmate() ) {
            pgnMove += '#'
        } 
        // check
        else if (this.isCheck()) {
            pgnMove += '+'
        }
        
        this.pgnMoves.push(pgnMove);
    }

    indexMoveFromPGN(move = 'e4') {
        // handle error if not valid move
        const moveMatches =  [...move.matchAll(/[a-h][1-8]/g)];
        let move2Match = null;
        if (moveMatches.length == 1) {
            move2Match = move.match(/[a-h][1-8]/g);
        } else {
            const returnMoves = [
                Utils.alphaToNum(moveMatches[0][0].toUpperCase()), 
                Utils.alphaToNum(moveMatches[1][0].toUpperCase())
            ]
            const promotionMatch = move.match(/\=[QRNB]/);
            if (promotionMatch) {
                returnMoves.push(promotionMatch[0])
            }
            return returnMoves;
        }
        if (!move2Match) {
            console.error('Not a valid PGN move.')
            return
        }

        const endIndex = Utils.alphaToNum(move2Match[0].toUpperCase());
        let piece  = move[0]
        // pawn move
        if (piece.match(/[a-h]/)) {
            piece = 'P'
        } 
        if (this.whiteToMove()) {
            piece = piece.toUpperCase()
        } else {
            piece = piece.toLowerCase();
        }
        let pieceNum = pieces[piece]
        let startingMoves = []
        const map = {}
        this.currentLegalMoves.forEach(move => {
            map[move[0]] = move.slice(1).flat()
        })
        
        for (let i = 0; i < this.current.length; i++) {
            const pieceCode = this.current[i];
            if (pieceCode == pieceNum) {
                if (map[i].includes(endIndex)) {
                    startingMoves.push(i)
                }
            }
        }
        // let's say multiple Knights could move to e2
        if (startingMoves.length > 1) {
            // try to column letter, 
            if (move.slice(1,3).match(/[a-h][a-h]/)) {
                let columnsPos = startingMoves.map(i => cols[Utils.getCol(i)].toLowerCase());
                let index = columnsPos.indexOf(move[1])
                startingMoves = [startingMoves[index]]
                
            // or try to get row number
            } else if (move[1].match(/[1-8]/)) {
                let rowsPos = startingMoves.map(i => rows[Utils.getRow(i)])
                let index = rowsPos.indexOf(move[1]);
                  startingMoves = [startingMoves[index]]
            } else {
                startingMoves = [startingMoves[0]]
            }
        }
        if (!startingMoves[0] && startingMoves[0] != 0) {
            return null
        }
        const returnMoves = [startingMoves[0], endIndex];
        const promotionMatch = move.match(/\=[QRNB]/);
        if (promotionMatch) {
            returnMoves.push(promotionMatch[0])
        }
        return returnMoves

    }

    generatePGNString() {
        let str = '';
        let inc = 0;
        this.pgnMoves.forEach((move, i) => {
            if (!(i%2)) {
                inc++;
                str += inc + '. '
                str += move + ' '

            } else {
                str += move + ' \n'
            }
        })
        return str;
    }

    appendMove(indexA, indexB, promotion) {
        const move = [indexA, indexB]
        if (promotion) {
            move.push(promotion)
        }
        this.moves.push(move);
    }

    // this takes a start square, end square, and (if promoting pawn) a promotion piece
    move(indexA, indexB, promotion){
        if(this.gameover) return false;
        if(this.currentIndex < this.positions.length - 1) return false;
        if(this.validateBaseMove(indexA, indexB)){
            if(this.tryMove(indexA,indexB)){
                this.setAuxiliaryPieces(indexA, indexB, promotion);
                this.setMove50Counter(indexA, indexB);
                this.setPosition(indexA,indexB);
                this.setState(indexA, indexB);
                this.appendPGN(indexA, indexB);
                this.appendMove(indexA, indexB, promotion);
            } else {
                return false;
            }
        } else {
            return false;
        }
        return this.current;
    }
}

export default Board;
