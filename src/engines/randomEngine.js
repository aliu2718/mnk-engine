/**
 * [RandomEngine] represents an engine that makes random legal moves in the game.
 */
export default class RandomEngine {
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
      let visualizer = this.controller.getVisualizer();
      visualizer.resetVisualizations();
      visualizer.visualizeMoves(moves);
    }
  }

  /**
   * Returns the best [k] moves in the game alongside the evaluations for each
   * move. The best moves are determined randomly, namely by shuffling the array 
   * of legal moves, then retrieving the first [k] moves in the newly shuffled 
   * array. The evaluation for each move is the uniform probability of randomly
   * sampling that move among all legal moves.
   * 
   * If visualizing the engine's moves, the array of legal moves is shuffled 
   * multiple times, with the best [k] moves for each repetition visualized on 
   * the game board. 
   */
  async getBestMoves(k) {
    let legalMoves = this.controller.getLegalMoves();
    const prob = 1 / legalMoves.length;

    // Timer for visualizations
    const timer = ms => new Promise(res => setTimeout(res, ms));
    const delay = this.visualize ? 200 : 0;

    let bestMoves = [];
    const repetitions = 5;
    for (let m = 0; m < repetitions; m++) {
      // Fisher-Yates Shuffle
      for (let i = legalMoves.length - 1; i > 0; i--) {
        const randIndex = Math.floor(Math.random() * (i + 1));
        let temp = legalMoves[i];
        legalMoves[i] = legalMoves[randIndex];
        legalMoves[randIndex] = temp;
      }

      bestMoves = [];
      for (let i = 0; i < k && i < legalMoves.length; i++) {
        bestMoves.push([legalMoves[i], prob]);
      }

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