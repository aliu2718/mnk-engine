import React from 'react';
import Board from './Board.js';
import Visualizer from './Visualizer.js';

/**
 * [Controller] represents a controller that handles the game logic. The
 * controller is responsible for dictating the interactions between the game
 * board, tiles, pieces, and players/engines. It initializes the game state 
 * based on specified game properties, and it contains the game logic needed
 * for a fully functioning game.
 */
export default class Controller extends React.Component {
  /**
   * Initializes a controller for a new game.
   * @param {Property} props The properties of the controller. 
   */
  constructor(props) {
    super(props);

    this.numRows = 20;
    this.numCols = 20;
    this.tilePx = 32;
    this.connect = 5;

    this.visualizer = new Visualizer(this);

    // For specifiying engines
    this.whiteEngine = null;
    this.blackEngine = null;

    // Initialize CSS variables
    document.documentElement.style.setProperty("--numRows", this.numRows);
    document.documentElement.style.setProperty("--numCols", this.numCols);
    document.documentElement.style.setProperty("--tileSize", this.tilePx + "px");
    document.documentElement.style.setProperty("--boardWidth", this.tilePx * this.numCols + "px");
    document.documentElement.style.setProperty("--boardHeight", this.tilePx * this.numRows + "px");
    document.documentElement.style.setProperty("--pieceSize", this.tilePx * 0.6 + "px");

    this.state = {
      boardState: [],
      piecesId: [],
      isBlackMove: true,
      isGameEnd: false
    };

    for (let i = 0; i < this.numRows; i++) {
      this.state.boardState.push([]);
      for (let j = 0; j < this.numCols; j++) {
        this.state.boardState[i].push(0);
      }
    }
  }

  // Track mouse position on webpage
  // onmousemove = function (event) {
  //   console.log("mouse location:", event.clientX, event.clientY)
  // }

  /**
   * Returns the number of connected pieces needed to win the game.
   * @returns An integer for the required number of connected pieces for a win.
   */
  getConnectionCriteria() {
    return this.connect;
  }

  /**
   * Returns the number of rows in the game board.
   * @returns An integer for the number of rows.
   */
  getNumRows() {
    return this.numRows;
  }

  /**
   * Returns the number of columns in the game board.
   * @returns An integer for the number of columns.
   */
  getNumCols() {
    return this.numCols;
  }

  /**
   * Returns the IDs of the pieces on the board.
   * @returns An array of piece IDs.
   */
  getPiecesId() {
    return this.state.piecesId;
  }

  /**
   * Returns the UI visualizer for the game.
   * @returns The visualizer for the game.
   */
  getVisualizer() {
    return this.visualizer;
  }

  /**
   * Returns the current board state in the game.
   * @returns A 2d array representing the current board state.
   */
  getBoardState() {
    return this.state.boardState;
  }

  /**
   * Returns whether or not the game has ended.
   * @returns A boolean for whether or not the game has ended.
   */
  isGameEnd() {
    return this.state.isGameEnd;
  }

  /**
   * Returns whether or not the current move is black's move.
   * @returns A boolean for whether or not the current move is black's move.
   */
  isBlackMove() {
    return this.state.isBlackMove;
  }

  /**
   * Returns all legal moves in the game state.
   * @returns An array of [column, row] coordinates of all legal moves.
   */
  getLegalMoves() {
    let legalMoves = [];

    for (let i = 0; i < this.numCols; i++) {
      for (let j = 0; j < this.numRows; j++) {
        if (this.state.boardState[j][i] == 0) {
          legalMoves.push([i + 1, j + 1]);
        }
      }
    }

    return legalMoves;
  }

  /**
   * Adds a piece in the specified row and column coordinates of the game state
   * representation and the corresponding visual tile. The new piece is automatically
   * assigned the appropriate color.  
   * @param {Number} row The row-coord of the new piece on the board. 
   * @param {Number} col The column-coord of the new piece on the board. 
   */
  setPiece(row, col) {
    this.state.boardState[row - 1][col - 1] = this.state.isBlackMove ? -1 : 1;
    this.state.piecesId.push((col, row));

    this.visualizer.setPiece(row, col);
  }

  /**
   * Returns the maximum connection length of the line of same-colored pieces 
   * that includes the piece at the specified row and column coordinates.  
   * @param {Number} row The row-coord of the piece on the board. 
   * @param {Number} col The column-coord of the piece of the board. 
   * @returns An integer for the maximum length single-color line containing
   * the piece at the specified row and column coordinates.
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
        while (r >= 0 && r < this.numRows && c >= 0 && c < this.numCols) {
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
   * Updates the game state appropriately based on a move made on the specified
   * row and column coordinates. Updating the game state involves:
   * 
   * -- Setting the piece in the game state and visual board
   * -- Checking if the move is a winning move that ends the game
   * -- Updating what color is currently moving
   * -- Updating the visual interface
   * -- Requesting a move from an engine
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

    const connection = this.checkConnect(row, col);
    //console.log(connection);

    if (connection >= this.connect) {
      this.state.isGameEnd = true;
    }

    this.state.isBlackMove = !this.state.isBlackMove;
    this.visualizer.updateInterface(row, col);

    if (!this.state.isGameEnd) {
      this.requestEngineMove();
    }
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
  updatePlayerMove(row, col) {
    if (!this.state.isGameEnd && this.state.boardState[row - 1][col - 1] == 0) {
      if ((this.whiteEngine == null && !this.state.isBlackMove) ||
        (this.blackEngine == null && this.state.isBlackMove)) {
        this.updateState(row, col);
      }
    }
  }

  /**
   * Requests a move from the engine if it is currently an engine's turn, then
   * updates the game state based on the move returned by the engine.
   */
  async requestEngineMove() {
    const timer = ms => new Promise(res => setTimeout(res, ms));
    const delay = 50;

    if (!this.state.isGameEnd) {
      if (this.blackEngine != null && this.state.isBlackMove) {
        await timer(delay);
        var [col, row] = await this.blackEngine.getMove();
        this.updateState(row, col);
      } else if (this.whiteEngine != null && !this.state.isBlackMove) {
        await timer(delay);
        var [col, row] = await this.whiteEngine.getMove();
        this.updateState(row, col);
      }
    }
  }

  /**
   * Sets the specified color in the game to the engine, then requests an
   * engine move if it is currently the engine's turn.
   * @param {String} color The color to set as the engine, either 'black' or 'white'. 
   * @param {Engine} engine The game engine. 
   */
  setEngine(color, engine) {
    if (color == 'black') {
      this.blackEngine = engine;
      if (this.blackEngine != null && this.state.isBlackMove) {
        this.requestEngineMove();
      }
    } else {
      this.whiteEngine = engine;
      if (this.whiteEngine != null && !this.state.isBlackMove) {
        this.requestEngineMove();
      }
    }
  }

  /**
   * Renders a new board for the game.
   * @returns A board element for the game.
   */
  renderBoard() {
    let board = (new Board(this, this.numRows, this.numCols)).initialize();

    return board;
  }
}