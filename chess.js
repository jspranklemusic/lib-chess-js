import Moves from "./moves.js";
import Board, { cols, rows, unicodeCharMap } from "./board.js"
import Utils from "./utils.js";

window.Utils = Utils;
window.Board = Board;
window.Moves = Moves;

// capital characters are WHITE, lower case are black
/*
P - white pawn
N - white knight
B - white bishop
R - white Rook
Q - white Queen
K - white king

p - black pawn
n - black knight
b - black bishop
r - black rook
q - black queen
k - black king

these will be stored in an array.

0-7   : A1-H1:
8-15  : A2-H2:
16-23 : A3-H3:
24-31 : A4-H4:
32-39 : A5-H5:
40-47 : A6-H6:
48-55 : A7-H7:
56-63 : A8-H8:

*/


const board = new Board();
window.board = board;

let move1 = -1;
let move2 = -1;

function makeBoard(board){
    move1 = -1;
    move2 = -1;
    document.querySelector(".board").innerHTML = "";
    for(let j in board.current){
        const i = 63 - j;
        const square = board.current[i];
        const space = document.createElement("div");
        space.classList.add("square");
        space.setAttribute("id",i);
        space.setAttribute("coordinate",Utils.numToAlpha(i));
        const row = 8 - (((i - (i%8))+8)/8);
        const column = 8 - (1 + i%8);

        if(row%2 && !(column%2)){
            space.classList.add("filled");
        }
        if(!(row%2) && (column%2)){
            space.classList.add("filled");
        }
        if(unicodeCharMap[square]){
            const piece = document.createElement('span');
            piece.innerHTML = unicodeCharMap[square];
            space.appendChild(piece);
        }
        document.querySelector(".board").appendChild(space);
        space.addEventListener('click', e => {
            document.querySelectorAll(".selected").forEach(item => item.classList.toggle("selected"))
            if(space.firstChild && move1 < 0){
                space.classList.toggle("selected");
                move1 = parseInt(space.id)
            }else if(move1 >= 0 && move2 < 0){
                move2 = parseInt(space.id);
                board.move(move1, move2);
                makeBoard(board);
            }else {
                move1 = -1;
                move2 = -1;
            }
        })
    }
}

makeBoard(board)

window.makeBoard = makeBoard

