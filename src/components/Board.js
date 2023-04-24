import Tile from './Tile.js'

import './Board.css'

/**
 * [Board] represents a board for the game.
 */
export default class Board {
  /**
   * Initializes the properties of a new board.
   * @param {Controller} controller The controller for the game.
   * @param {Number} numRows The number of rows on the board.
   * @param {Number} numCols The number of columns on the board.
   */
  constructor(controller, numRows, numCols) {
    this.controller = controller;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  /**
   * Initializes a board for the game, including initializing the tiles, based
   * on the number of rows and columns in the board's properties. 
   * @returns An array of tile elements, representing the board.
   */
  initialize() {
    let board = [];

    for (let i = this.numRows; i > 0; i--) {
      for (let j = 1; j <= this.numCols; j++) {
        const tile = new Tile(this.controller, i, j);
        board.push(
          tile.initialize()
        );
      }
    }

    return (
      <div id="board">
        {board}
      </div>
    )
  }
}
