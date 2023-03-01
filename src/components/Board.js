import Tile from './Tile.js'

import './Board.css'

/**
 * [Board] represents a board for the game.
 */
export default class Board {
  /**
   * Initializes the properties of a new board.
   * @param {Constructor} constructor The controller for the game.
   * @param {Number} rowNum The number of rows on the board.
   * @param {Number} colNum The number of columns on the board.
   */
  constructor(constructor, rowNum, colNum) {
    this.controller = constructor;
    this.rowNum = rowNum;
    this.colNum = colNum;
  }

  /**
   * Initializes a board for the game, including initializing the tiles, based
   * on the number of rows and columns in the board's properties. 
   * @returns An array of tile elements, representing the board.
   */
  initialize() {
    let board = [];

    for (let i = this.rowNum; i > 0; i--) {
      for (let j = 1; j <= this.colNum; j++) {
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
