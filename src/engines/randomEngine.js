/**
 * [RandomEngine] represents an engine that makes random legal moves in the game.
 */
export default class RandomEngine {
  /**
   * Initializes a random engine.
   * @param {Controller} controller The controller for the game. 
   */
  constructor(controller) {
    this.controller = controller;
  }

  /**
   * Returns the best [k] moves in the game alongside the evaluations for each
   * move. The best moves are determined randomly, namely by shuffling the array 
   * of legal moves, then retrieving the first [k] moves in the newly shuffled 
   * array. The evaluation for each move is the uniform probability of randomly
   * sampling that move among all legal moves.
   */
  getBestMoves(k) {
    let legalMoves = this.controller.getLegalMoves();
    const prob = 1 / legalMoves.length;

    // Fisher-Yates Shuffle
    for (let i = legalMoves.length - 1; i > 0; i--) {
      const randIndex = Math.floor(Math.random() * (i + 1));
      let temp = legalMoves[i];
      legalMoves[i] = legalMoves[randIndex];
      legalMoves[randIndex] = temp;
    }

    let bestMoves = [];
    for (let i = 0; i < k; i++) {
      bestMoves.push([legalMoves[i], prob]);
    }

    return bestMoves;
  }

  /**
   * Returns the best move as determined by the engine. The best move is the 
   * first move in the array of best moves.
   */
  getMove() {
    let bestMoves = this.getBestMoves(5);
    return bestMoves[0][0];
  }
}