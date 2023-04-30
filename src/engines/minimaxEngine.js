/**
 * [MinimaxEngine] represents an engine that makes legal moves  in the game
 * as determined by the minimax algorithm.
 */
export default class MinimaxEngine {
  /**
   * Initializes a random engine.
   * @param {Controller} controller The controller for the game. 
   * @param {Boolean} visualize Whether or not to visualize the engine's moves.
   */
  constructor(controller, visualize) {
    this.controller = controller;
    this.visualize = visualize;
  }

  /**
   * Requests a visualization of the moves provided in [moves] based on the 
   * specified evaluation value for each move.
   * @param {Array} moves A 2d array of moves and evaluation values. The moves are 
   * 2d [row, col] arrays, and the evaluation values are between 0 and 1.
   */
  visualizeMoves(moves) {
    if (this.visualize) {
      x
      let visualizer = this.controller.getVisualizer();
      visualizer.resetVisualizations();
      visualizer.visualizeMoves(moves);
    }
  }
  /**
   * Minimax algorithm
   */
  async minimax(isBlackMove, controller) {
    if (controller.state.isGameEnd) {
      return 0
    }
    scores = []

    for (let i = legalMoves.length - 1; i > 0; i--) {
      this.controller.setPiece(legalMoves[i])
      scores.add(minimax(!isBlackMove, controller))
      this.controller.undoPiece(legalMoves[i])
    }

    if (isBlackTurn) {
      return scores.max()
    }
    else return scores.min()
  }

  /**
   * Returns the best [k] moves in the game alongside the evaluations for each
   * move. The best moves are determined by the minimax algrithm, which takes in
   * an array of legal moves and outputs the first [k] moves that will maximize 
   * [score] in descending order. 
   * 
   * TO EDIT: If visualizing the engine's moves, the array of legal moves is shuffled 
   * multiple times, with the best [k] moves for each repetition visualized on 
   * the game board. 
   */
  async getBestMoves(k) {
    let legalMoves = this.controller.getLegalMoves(); //array of coords
    const prob = 1 / legalMoves.length;

    // Timer for visualizations
    const timer = ms => new Promise(res => setTimeout(res, ms));
    const delay = this.visualize ? 200 : 0;

    let bestScore = -Math.inf; //Jane
    let bestMoves = [];
    const repetitions = 5;
    for (let m = 0; m < repetitions; m++) {
      // call minimax algo
      for (let i = legalMoves.length - 1; i > 0; i--) {
        let temp = legalMoves[i];
        this.controller.setPiece(temp)

        score = minimax(this.controller.state.isBlackMove, this.controller)

        this.controller.undoPiece(temp)

        if (score > bestScore) {
          bestScore = score
          bestMoves.push(temp)
        }
        this.controller.setPiece(move)
      }
      //end 

      this.visualizeMoves(bestMoves);
      if (m != repetitions - 1) {
        await timer(delay);
      }
    }

    return bestMoves;
  }

  /**
   * Returns the best move as determined by the engine. The best move is the 
   * first move in the array of best moves.
   */
  async getMove() {
    const bestMoves = await this.getBestMoves(10);
    return bestMoves[0][0];
  }
}