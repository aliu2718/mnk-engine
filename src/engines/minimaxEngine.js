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
  /** Game state evaluator */

  /**
   * Requests a visualization of the moves provisded in [moves] based on the 
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

  /** Set piece */
  async setPiece(pos, controller) {
    let row = pos[0];
    let col = pos[1];
    let controllerCopy = controller;
    controllerCopy.state.boardState[row - 1][col - 1] = controller.state.isBlackMove ? -1 : 1;
    controllerCopy.state.piecesId.push(pos);
    controllerCopy.state.isBlackMove = controller.state.isBlackMove;
    return controllerCopy;
  }

  /** Undo piece */
  async undoPiece(pos, controller) {
    let row = pos[0];
    let col = pos[1];
    let controllerCopy = controller;
    controllerCopy.state.boardState[row - 1][col - 1] = 0;
    controllerCopy.state.piecesId.push(pos);
    controllerCopy.state.isBlackMove = controller.state.isBlackMove; s
    return controllerCopy
  }

  /**
   * Win condition checker
   */
  async gameWon(pos, controller) {
    let maxConnect = controller.checkConnect(pos);
    return controller.props.connect == maxConnect; //TODO: pass in k
  }
  /**
   * Minimax algorithm
   */
  async minimax(isBlackMove, controller, pos) {
    let scores = []
    if (controller.state.isGameEnd) {
      return 0
    }
    if (this.gameWon(pos, controller)) {
      if (isBlackMove) {
        scores.push(1)
      }
      else {
        scores.push(-1)
      }
    }
    let legalMoves = this.controller.getLegalMoves()
    for (let i = legalMoves.length - 1; i > 0; i--) {
      this.setPiece(legalMoves[i], controller)
      scores.add(this.minimax(!isBlackMove, controller))
      this.undoPiece(legalMoves[i], controller)
    }

    if (isBlackMove) {
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

    // Timer for visualizations
    const timer = ms => new Promise(res => setTimeout(res, ms));
    const delay = this.visualize ? 200 : 0;

    let bestScore = -Math.inf;
    let bestMoves = [];

    // call minimax algo
    for (let i = legalMoves.length - 1; i > 0; i--) {
      let temp = legalMoves[i];
      let controllerCopy = this.setPiece(temp, this.controller)
      let score = this.minimax(controllerCopy.state.isBlackMove, controllerCopy, temp)
      controllerCopy = this.undoPiece(temp, this.controller)

      if (score > bestScore) {
        bestScore = score
        bestMoves.push(temp)
      }
      this.controller.setPiece(temp)
    }
    //end 

    this.visualizeMoves(bestMoves);
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