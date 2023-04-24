import Piece from './Piece.js';

/**
 * [Visualizer] is a visualization tool for making real-time UI text and board 
 * changes, including updating the played moves and visualizing engine evaluations.  
 */
export default class Visualizer {
  constructor(controller) {
    this.controller = controller;
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

    if (this.controller.getPiecesId().length % 10 == 0) {
      moveList.innerHTML += '<br />'
    }

    var turnText = document.getElementById('turnText');
    if (this.controller.isGameEnd()) {
      const color = !this.controller.isBlackMove() ? 'Black' : 'White';
      turnText.innerHTML = color + ' Won!';
    } else {
      const color = this.controller.isBlackMove() ? 'Black' : 'White';
      turnText.innerHTML = color + ' Move';
    }
  }

  /**
   * Creates a piece visual with the appropriate color at the specified row 
   * and column coordinates.
   * @param {Number} row The row-coord of the move.
   * @param {Number} col The column-coord of the move.
   */
  setPiece(row, col) {
    const pieceColor = this.controller.isBlackMove() ? 'black' : 'white';
    const piece = (new Piece(pieceColor, row, col)).initialize();

    document.getElementById(`${col},${row}`).append(piece);
  }

  /**
   * Constructs an rgb color from a red-yellow-green gradient based on the
   * [fadeFraction]. A higher [fadeFraction] corresponds to redder colors while
   * a lower [fadeFraction] corresponds to greener colors.
   * @param {Float} fadeFraction A value between 0 and 1 specifying the color.
   * @returns An rgb color 
   */
  colorGradient(fadeFraction) {
    var color1 = {
      red: 19, green: 233, blue: 19
    };
    var color3 = {
      red: 255, green: 0, blue: 0
    };
    var color2 = {
      red: 255, green: 255, blue: 0
    };

    var fade = 2 * fadeFraction;

    if (fade >= 1) {
      fade -= 1;
      color1 = color2;
      color2 = color3;
    }

    var diffRed = color2.red - color1.red;
    var diffGreen = color2.green - color1.green;
    var diffBlue = color2.blue - color1.blue;

    var gradient = {
      red: Math.floor(color1.red + (diffRed * fade)),
      green: Math.floor(color1.green + (diffGreen * fade)),
      blue: Math.floor(color1.blue + (diffBlue * fade)),
    };

    return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
  }

  /**
   * Visualizes the moves provided in [evals] based on the specified evaluation
   * value for each move. The corresponding squares are recolored depending on
   * the evaluation value, and the colors are based on a red-yellow-green
   * gradient.
   * @param {Array} evals A 2d array of moves and evaluation values. The moves are 
   * 2d [row, col] arrays, and the evaluation values are between 0 and 1. 
   */
  visualizeMoves(evals) {
    for (let i = 0; i < evals.length; i++) {
      var [move, score] = evals[i];
      var [col, row] = move;

      var moveTile = document.getElementById(`${col},${row}`);
      if (moveTile != null) {
        moveTile.style.backgroundColor = this.colorGradient(1 - score);
      }
    }
  }

  /** 
   * Removes all visualizations on the board, reseting the color of each tile
   * to the default board color.
   */
  resetVisualizations() {
    let numCols = this.controller.getNumCols();
    let numRows = this.controller.getNumRows();
    for (let col = 1; col <= numCols; col++) {
      for (let row = 1; row <= numRows; row++) {
        var tile = document.getElementById(`${col},${row}`);
        if (tile != null) {
          tile.style.backgroundColor = '#d59f75';
        }
      }
    }
  }
}