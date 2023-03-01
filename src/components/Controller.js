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

    this.rowNum = 9;
    this.colNum = 9;
    this.tilePx = 60;
    this.connect = 5;

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
      isBlackMove: true,
      isGameEnd: false
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
   * Returns the maximum connection length of the line of same-colored pieces 
   * that includes the piece at the specified row and column coordinates.  
   * @param {Number} row The row-coord of the piece on the board. 
   * @param {Number} col The column-coord of the piece of the board. 
   * @returns 
   */
  checkConnect(row, col) {
    let directions = [[1, 0], [0, 1], [1, -1], [1, 1]];
    let connectionLengths = new Set();

    for (let i = 0; i < directions.length; i++) {
      const pieceValue = this.state.boardState[row - 1][col - 1];
      var connectionCount = 1;

      var [changeR, changeC] = directions[i];
      var [r, c] = [row - 1 + changeR, col - 1 + changeC];

      for (let j = 0; j < 2; j++) {
        while (r >= 0 && r < this.rowNum && c >= 0 && c < this.colNum) {
          if (this.state.boardState[r][c] == pieceValue) {
            connectionCount += 1;
            [r, c] = [r + changeR, c + changeC];
          } else {
            break;
          }
        }

        [changeR, changeC] = [-changeR, -changeC];
        [r, c] = [row - 1 + changeR, col - 1 + changeC];
      }

      connectionLengths.add(connectionCount);
    }

    return Math.max.apply(this, [...connectionLengths]);
  }

  /**
   * Updates the text interface based on the move. The move is displayed on the
   * webpage, and the display for the turn is updated.
   * @param {Number} row The row-coord of the move. 
   * @param {Number} col The column-coord of the move. 
   */
  updateInterface(row, col) {
    var moveList = document.getElementById('moveList');
    var move = document.createTextNode(` (${col}, ${row})`);
    moveList.appendChild(move);

    console.log(this.state.piecesId.length);
    if (this.state.piecesId.length % this.colNum == 0) {
      moveList.innerHTML += '<br />'
    }

    var turnText = document.getElementById('turnText');
    if (this.state.isGameEnd) {
      const color = !this.state.isBlackMove ? 'Black' : 'White';
      turnText.innerHTML = color + ' Won!';
    } else {
      const color = this.state.isBlackMove ? 'Black' : 'White';
      turnText.innerHTML = color + ' Move';
    }
  }

  /**
   * Updates the game state appropriately based on a move made on the specified
   * row and column coordinates. Updating the game state involves setting the 
   * piece, updating what color is currently moving, and checking if the move
   * is a winning move.
   * 
   * This method is only called when the move is legal.
   * @param {Number} row The row-coord of the move on the board. 
   * @param {Number} col The column-coord of the move on the board. 
   */
  updateState(row, col) {
    if (this.state.isGameEnd) {
      return;
    }

    this.setPiece(row, col);
    //console.log(this.state.boardState);

    const connection = this.checkConnect(row, col);
    console.log(connection);

    if (connection >= this.connect) {
      this.state.isGameEnd = true;
      console.log("Game End");
    }

    this.state.isBlackMove = !this.state.isBlackMove;
    this.updateInterface(row, col);
  }

  /**
   * Requests an update to the game state only if the player move is appropriate.
   * The player move is appropriate if the specified row and column coordinate is
   * unoccupied by a piece and a player is currently making the move.
   * 
   * This method is only called when a player action is made and is not referenced
   * by engines. 
   * @param {Number} row The row-coord of the player move.
   * @param {Number} col The column-coord of the player move. 
   */
  requestPlayerMove(row, col) {
    if (!this.state.isGameEnd && this.state.boardState[row - 1][col - 1] == 0) {
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