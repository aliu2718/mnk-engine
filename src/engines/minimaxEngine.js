// Currently not working: have to incorporate better into game code 



/**
 * [RandomEngine] represents an engine that makes random legal moves in the game.
 */
export default class MinMaxEngine {
  /**
   * Initializes a random engine.
   * @param {Controller} controller The controller for the game. 
   */
  constructor(controller) {
    this.controller = controller;
  }

  emptyIndexies(board) {
    return board.filter(s => s != "O" && s != "X");
  }

  winning(board, player) {
    
  }

  /**
   * Returns the best [k] moves in the game alongside the evaluations for each
   * move. 
   */
  getBestMoves(newBoard, player) {

    //available spots
    var spotsLeft = this.emptyIndexies(newBoard);

    // checks for the terminal states such as win, lose, and tie 
    //and returning a value accordingly
    if (winning(newBoard, blackPlayer)) {
      return { score: Math.min() };
    }
    else if (winning(newBoard, whitePlayer)) {
      return { score: Math.max() };
    }
    else if (spotsLeft.length === 0) {
      return { score: 0 };
    }


    let legalMoves = this.controller.getLegalMoves();

    // loop through available spots
    for (var i = 0; i < spotsLeft.length; i++) {
      //create an object for each and store the index of that spot 
      var move = {};
      move.index = newBoard[spotsLeft[i]];

      // set the empty spot to the current player
      newBoard[spotsLeft[i]] = player;

      /*collect the score resulted from calling minimax 
        on the opponent of the current player*/
      if (this.controller.isBlackMove == true) {
        var result = minimax(newBoard, blackPlayer);
        move.score = result.score;
      }
      else {
        var result = minimax(newBoard, whitePlayer);
        move.score = result.score;
      }

      // reset the spot to empty
      newBoard[spotsLeft[i]] = move.index;

      // push the object to the array
      legalMoves.push(move);




      var bestMove;
      if (this.controller.isBlackMove == true) {
        var bestScore = -10000;
        for (var i = 0; i < moves.length; i++) {
          if (moves[i].score > bestScore) {
            bestScore = moves[i].score;
            bestMove = i;
          }
        }
      } else {

        // else loop over the moves and choose the move with the lowest score
        var bestScore = 10000;
        for (var i = 0; i < moves.length; i++) {
          if (moves[i].score < bestScore) {
            bestScore = moves[i].score;
            bestMove = i;
          }
        }
      }

      // return the chosen move (object) from the moves array
      return moves[bestMove];
    }
  }
}