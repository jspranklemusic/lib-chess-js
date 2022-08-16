# lib-chess-js
A simple, vanilla Javascript chess library that uses a 1-dimensional array of 8-bit integers to keep track of positions on the board.

## Usage

To start, you must instantiate an instance of a *board* class. 

`const board = new Board();`

This will move whatever piece is on square 12 *(E2)* to square 20 *(E4)*. There are built-in rules and validations to enforce turns, checks, checkmates, stalemate, en passant, and castling.
To help keep track of the numbers, there are several functions in the static class *Utils.js* such as `alphaToNum(coord)` which converts a coordinate (e.g. "F5") to an index (0 - 63)  and `numToAlpha(index)`, which does the reverse.

To move from E2 to E4, (white King's pawn opening), you would call:

`board.move(12, 20)`

To resign, call:

`board.resign(true)`


Calling *board.resign* with __true__ would make white resign, while calling with __false__ would make black resign.

After every single move (and before the 1st move), a `setState` method is called which adds all of the information from the just-placed move to set variables and look for checkmate.
At any point after a move has been made, you can check for a game ending condition by looking at the `board.gameover` variable.





