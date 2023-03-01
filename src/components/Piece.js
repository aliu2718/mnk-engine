import './Piece.css'

/** 
 * [Piece] represents a piece in the game.
 */
export default class Piece {
  /**
   * Initializes the properties of a new piece.
   * @param {String} color The color of the piece, either 'black' or 'white' 
   * @param {Number} row The row-coord of the piece in the game
   * @param {Number} col The column-coord of the piece in the game 
   */
  constructor(color, row, col) {
    this.color = color + '-piece';
    this.row = row;
    this.col = col;
  }

  /**
   * Initializes a piece element for displaying the piece visually.
   * @returns A piece element to display on a tile.
   */
  initialize() {
    const piece = document.createElement('div');
    piece.classList.add(this.color);
    piece.setAttribute('id', `${this.col}-${this.row}`);

    return piece;
  }
}