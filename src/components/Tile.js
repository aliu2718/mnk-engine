import './Tile.css';

/**
 * [Tile] represents a single tile in the game board.
 */
export default class Tile {
  /**
   * Initializes the properties of a a new tile.
   * @param {Controller} constructor The controller for the game. 
   * @param {Number} row The row-coord of the tile on the board. 
   * @param {Number} col The column-coord of the tile on the board. 
   */
  constructor(constructor, row, col) {
    this.controller = constructor;
    this.row = row;
    this.col = col;
  }

  /**
   * Requests a player move to the controller when the tile is clicked. 
   */
  handleOnClick() {
    this.controller.requestPlayerMove(this.row, this.col);
  }

  /**
   * Initializes a tile element with a unique key and id, dependent on the 
   * coordinates of the tile, and an on-click action.
   * @returns A tile element to display on the board.
   */
  initialize() {
    return (
      <div
        key={`${this.col},${this.row}`}
        id={`${this.col},${this.row}`}
        className='tile'
        onClick={() => this.handleOnClick()}>
      </div>
    )
  }
}