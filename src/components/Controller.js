import React from 'react'
import Board from './Board.js'
import Piece from './Piece.js'

/**
 * [Controller] represents a controller that handles the game logic. The
 * controller is responsible for dictating the interactions between the game
 * board, tiles, pieces, and players/engines. It initializes the game state 
 * based on specified game properities, and it contains the game logic needed
 * for a fully functioning game.
 */
export default class Controller extends React.Component {
  /**
   * Initializes a controller for a new game.
   * @param {Property} props The properties of the controller. 
   */
  constructor(props) {
    super(props);

    this.rowNum = 3;
    this.colNum = 3;
    this.tilePx = 75;

    // For specifiying engines
    this.whiteEngine = null;
    this.blackEngine = null;

    // Initialize CSS variables
    document.documentElement.style.setProperty("--rowNum", this.rowNum);
    document.documentElement.style.setProperty("--colNum", this.colNum);
    document.documentElement.style.setProperty("--tileSize", this.tilePx + "px");
    document.documentElement.style.setProperty("--boardWidth", this.tilePx * this.colNum + "px");
    document.documentElement.style.setProperty("--boardHeight", this.tilePx * this.rowNum + "px");
    document.documentElement.style.setProperty("--pieceSize", this.tilePx * 0.5 + "px");

    this.state = {
      boardState: [],
      piecesId: [],
      isBlackMove: true
    };

    for (let i = 0; i < this.rowNum; i++) {
      this.state.boardState.push([]);
      for (let j = 0; j < this.colNum; j++) {
        this.state.boardState[i].push(0);
      }
    }
  }

  // Track mouse position on webpage
  // onmousemove = function (event) {
  //   console.log("mouse location:", event.clientX, event.clientY)
  // }

  /**
   * Adds a piece in the specified row and column coordinates of the game state
   * representation and the corresponding visual tile. The new piece is automatically
   * assigned the appropriate color.  
   * @param {Number} row The row-coord of the new piece on the board. 
   * @param {Number} col The column-coord of the new piece on the board. 
   */
  setPiece(row, col) {
    this.state.boardState[row - 1][col - 1] = this.state.isBlackMove ? -1 : 1;

    const pieceColor = this.state.isBlackMove ? 'black' : 'white';
    const piece = (new Piece(pieceColor, row, col)).initialize();

    document.getElementById(`${col},${row}`).append(piece);
    this.state.piecesId.push((col, row));
  }

  /**
   * Updates the game state appropriately based on a move made on the specified
   * row and column coordinates. Updating the game state involves setting the 
   * piece and updating what color is currently moving.
   * 
   * This method is only called when the move is legal.
   * @param {Number} row The row-coord of the move on the board. 
   * @param {Number} col The column-coord of the move on the board. 
   */
  updateState(row, col) {
    this.setPiece(row, col);
    //console.log(this.state.boardState);

    this.state.isBlackMove = !this.state.isBlackMove;
  }

  /**
   * Requests an update to the game state only if the player move is appropriate.
   * The player move is appropriate if the specified row and column coordinate is
   * unoccupied by a piece and a player is currently making the move.
   * 
   * This method is only called when a player action is made and is not referenced
   * by engines. 
   * @param {*} row 
   * @param {*} col 
   */
  requestPlayerMove(row, col) {
    if (this.state.boardState[row - 1][col - 1] == 0) {
      if ((this.whiteEngine == null && !this.state.isBlackMove) ||
        (this.blackEngine == null && this.state.isBlackMove)) {
        this.updateState(row, col);
      }
    }
  }

  /**
   * Renders a new board for the game.
   * @returns A board element for the game.
   */
  renderBoard() {
    let board = new Board(this, this.rowNum, this.colNum);

    return board.initialize();
  }
}