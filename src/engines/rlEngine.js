import FileSaver from "file-saver";

/**
 * [ReinforcementLearningEngine] represents a reinforcement learning engine that 
 * improves its move policy through self-play.
 */
export default class RLEngine {
  /**
   * Initializes a reinforcement learning engine.
   * @param {Controller} controller The controller for the game. 
   * @param {Boolean} visualize Whether or not to visualize the engine's moves.
   * @param {Boolean} preload Whether or not to load an existing neural network.
   */
  constructor(controller, visualize, preload = false) {
    this.controller = controller;
    this.visualize = visualize;

    this.convnetjs = require("convnetjs");

    if (!preload) {
      // Create a convolutional neural network
      var layer_defs = [];
      layer_defs.push({ type: 'input', out_sx: 20, out_sy: 20, out_depth: 1 });
      layer_defs.push({ type: 'conv', sx: 5, filters: 8, stride: 1, pad: 2, activation: 'relu' });
      layer_defs.push({ type: 'pool', sx: 2, stride: 2 });
      layer_defs.push({ type: 'fc', num_neurons: 30, activation: 'relu' });
      layer_defs.push({ type: 'softmax', num_classes: 400 });

      this.net = new this.convnetjs.Net();
      this.net.makeLayers(layer_defs);
    } else {
      // Load an existing convolutional neural network
      var json = require('.//net/rlnet.json');
      this.net = new this.convnetjs.Net();
      this.net.fromJSON(json);
    }
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
   * Checks whether or not an array contains the specified item (an array).
   * @param {Array} arr A 2d array to search in 
   * @param {Array} item The array item to search for
   * @returns A boolean for whether or not the array item is in the 2d array
   */
  arrayContainsArray(arr, item) {
    var item_as_string = JSON.stringify(item);

    var contains = arr.some(function (ele) {
      return JSON.stringify(ele) === item_as_string;
    });

    return contains;
  }

  /**
   * Returns the maximum connection length of the line of same-colored pieces 
   * that includes the piece at the specified row and column coordinates.  
   * @param {Number} row The row-coord of the piece on the board
   * @param {Number} col The column-coord of the piece of the board
   * @param {Array} state The board state
   * @returns An integer for the maximum length single-color line containing
   * the piece at the specified row and column coordinates in the board state
   */
  checkConnect(row, col, state) {
    let directions = [[1, 0], [0, 1], [1, -1], [1, 1]];
    let connectionLengths = new Set();

    for (let i = 0; i < directions.length; i++) {
      const pieceValue = state[row - 1][col - 1];
      var connectionCount = 1;

      var [changeR, changeC] = directions[i];
      var [r, c] = [row - 1 + changeR, col - 1 + changeC];

      for (let j = 0; j < 2; j++) {
        while (r >= 0 && r < this.controller.getNumRows() && c >= 0 && c < this.controller.getNumCols()) {
          if (state[r][c] == pieceValue) {
            connectionCount += 1;
            [r, c] = [r + changeR, c + changeC];
          } else {
            break;
          }
        }

        [changeR, changeC] = [-changeR, -changeC];
        [r, c] = [row - 1 + changeR, col - 1 + changeC];
      }

      connectionLengths.add(connectionCount);
    }

    return Math.max.apply(this, [...connectionLengths]);
  }

  /**
   * Returns a deepcopy of the specified board state.
   * @param {Array} state The board state to copy 
   * @returns A deepcopy of the 2d array input
   */
  copyBoardState(state) {
    return structuredClone(state);
  }

  /**
   * Returns all legal moves in the board state.
   * @param {Array} state The board state
   * @returns An array of [column, row] coordinates of all legal moves
   */
  getStateLegalMoves(state) {
    let legalMoves = [];

    for (let i = 0; i < state[0].length; i++) {
      for (let j = 0; j < state.length; j++) {
        if (state[j][i] == 0) {
          legalMoves.push([i + 1, j + 1]);
        }
      }
    }

    return legalMoves;
  }

  /**
   * Simulates a full game starting from the specified [state] and turn [color].
   * 
   * This function implements the engine's self-playing mechanism, selecting moves
   * based on the engine's current policy (predictions from the convolutional
   * neural network), or randomly depending on the frequency specified by [epsilon]
   * as part of the epsilon-greedy exploration.
   * 
   * As the game is played, each of black's board and white's board (-1s and 1s swapped)
   * is tracked, as well as the move played on each of those boards. The boards will be
   * used as inputs to train the convolutional neural network.
   * 
   * This function returns a list of all of black's board states, a list of all of 
   * white's board states, a list of black's moves, a list of white's moves, and the 
   * winner of the simulated game.
   * @param {Array} state The board state to start the simulated game from 
   * @param {String} color The turn to start with
   * @param {Number} epsilon The frequency of random moves, for epsilon-greedy exploration
   * @returns A list of black's board states, white's board states, black's moves, 
   * white's moves, and the winner of the game
   */
  simulateGame(state, color, epsilon) {
    // Initialize boards
    let boardBlack = this.copyBoardState(state);
    let boardWhite = this.copyBoardState(state);

    for (let i = 0; i < this.controller.getNumRows(); i++) {
      for (let j = 0; j < this.controller.getNumCols(); j++) {
        if (boardWhite[i][j] != 0) {
          boardWhite[i][j] *= -1;
        }
      }
    }

    var boardsBlack = [];
    var boardsWhite = [];
    var movesBlack = [];
    var movesWhite = [];
    var winner = 0;

    // Get all legal moves for empty board
    let legalMoves = this.getStateLegalMoves(boardBlack);

    var turn = color;
    var isGameEnd = false;  // Assume game has not ended
    while (!isGameEnd) {
      // Get move, using epsilon-greedy exploration
      var move = null;
      if (Math.random() < epsilon) {
        move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        let state = turn === "black" ? boardBlack : boardWhite;
        let prediction = this.net.forward(state).w;
        // If move not legal, find next best move
        while (true) {
          let index = prediction.indexOf(Math.max(...prediction));
          prediction[index] = -Infinity;
          let col_length = state[0].length;
          move = [index % col_length + 1, Math.floor(index / col_length) + 1];

          if (this.arrayContainsArray(legalMoves, move)) {
            break;
          }
        }
      }

      // Check for win, and play move on boards
      const [col, row] = move;
      if (turn === "black") {
        boardBlack[row - 1][col - 1] = -1;
        boardWhite[row - 1][col - 1] = 1;
        boardsBlack.push(this.copyBoardState(boardBlack));
        movesBlack.push(move);

        // Check for game end
        if (this.checkConnect(row, col, boardBlack) >= this.controller.getConnectionCriteria()) {
          isGameEnd = true;
          winner = -1;
        }
      } else {
        boardBlack[row - 1][col - 1] = 1;
        boardWhite[row - 1][col - 1] = -1;
        boardsWhite.push(this.copyBoardState(boardWhite));
        movesWhite.push(move);

        if (this.checkConnect(row, col, boardWhite) >= this.controller.getConnectionCriteria()) {
          isGameEnd = true;
          winner = 1;
        }
      }

      // Change turn
      turn = turn === "black" ? "white" : "black";

      // Remove move from legalMoves
      if (!isGameEnd) {
        for (let i = 0; i < legalMoves.length; i++) {
          if (JSON.stringify(legalMoves[i]) === JSON.stringify(move)) {
            legalMoves.splice(i, 1);
            if (legalMoves.length === 0) {
              isGameEnd = true;
            }
            break;
          }
        }
      }
    }

    return [boardsBlack, boardsWhite, movesBlack, movesWhite, winner];
  }

  /**
   * Trains the convolutional neural network on one instance of [board] and 
   * [move] given [value].
   * 
   * The input is a 2d array representing the board state, and the label is 
   * a 1d array of zeros where the index corresponding to the move has a value
   * equal to the specified value.
   * @param {Trainer} trainer The trainer for the convolutional neural network
   * @param {Array} board The input board state 
   * @param {Array} move [col, row] specifying the move 
   * @param {Number} value The value to propagate to the move given the board state 
   */
  backpropagate(trainer, board, move, value) {
    // Format 400 entry array where index corresponding to last black move 
    // has value equal to the reward of winning the game
    let numRows = this.controller.getNumRows();
    let numCols = this.controller.getNumCols();
    let moveArray = new Array(numRows * numCols).fill(0);
    let [col, row] = move;
    moveArray[numCols * (col - 1) + row - 1] = value;

    // Convert final black board to trainable object
    let finalBoardBlack = new this.convnetjs.Vol(board);

    // Train neural network given the board as data and a move array as "label"
    trainer.train(finalBoardBlack, moveArray);
  }

  /**
   * Performs Q-learning for the engine.
   * 
   * Given a list of board states and corresponding moves that lead to a terminal
   * board state, the reward value and Q values are propagated to all previous board
   * states (depending on the [discount] and [alpha] values) to train the convolutional
   * neural network and update the Q values using the following equation:
   * 
   * Q(s_t, a) = discount^(# of moves before terminal) * reward + alpha * max{Q(s_{t+1}, a)} 
   * @param {Trainer} trainer The trainer for the convolutional neural network
   * @param {Array} boards An array of board states
   * @param {Array} moves An array of [col, row] moves corresponding to each board state 
   * @param {Number} reward The value assigned to a winning terminal state 
   * @param {Number} discount The percent by which to decrease the reward for each time step 
   * @param {Number} alpha The learning rate for Q-learning 
   * @param {Number} len The number of boards/moves 
   */
  qLearning(trainer, boards, moves, reward, discount, alpha, len) {
    this.backpropagate(trainer, boards[len - 1], moves[len - 1], reward, len);
    var prevQ = this.net.forward(boards[len - 1]).w;

    for (let iter = len - 2; iter >= 0; iter--) {
      // Go through all of the boards and moves and propagate a value to them using
      // neural network training
      let value = discount ** (len - iter - 1) * reward + alpha * Math.max(...prevQ);
      this.backpropagate(trainer, boards[iter], moves[iter], value);

      prevQ = this.net.forward(boards[iter]).w;
    }
  }

  /**
   * Trains the reinforcement learning engine.
   * 
   * The training process consists of playing [num_episodes] number of simulated
   * games against the engine's own policy with epsilon-greedy exploration, and 
   * updating the Q values based on the specified [reward], [discount], and [alpha] 
   * values. The training also attempts to punish moves that do not prevent losing
   * and emphasize moves that do prevent losing.
   * 
   * After each simulated game, the exploration frequency is adjusted by [ep_decay]
   * to prioritize exploitation of the policy as the engine learns from more games.
   * 
   * After training, the weights of the convolutional neural network are downloaded
   * as a JSON file so that they can be loaded by future reinforcement learning
   * engines.
   * @param {Number} num_episodes The number of simulated games to play
   * @param {Number} reward The value assigned to a winning terminal state  
   * @param {Number} discount The percent by which to decrease the reward for each time step 
   * @param {Number} epsilon The frequency of random moves, for epsilon-greedy exploration 
   * @param {Number} ep_decay The percent by which to decrease the exploration frequency after a game
   * @param {Number} alpha The learning rate for Q-learning 
   */
  train(num_episodes, reward, discount, epsilon, ep_decay, alpha) {
    const PUNISH = -0.75 * reward;

    // For training the neural network
    let trainer = new this.convnetjs.Trainer(
      this.net,
      {
        method: 'sgd',
        learning_rate: 0.0001,
        momentum: 0.5,
        l2_decay: 0.001,
        l1_decay: 0.001,
        batch_size: 1,
      }
    );

    for (let ep = 0; ep < num_episodes; ep++) {
      let turn = this.controller.isBlackMove() ? "black" : "white";
      // Simulate a game (a total of num_episodes games will be self-played)
      let simInfo = this.simulateGame(this.controller.getBoardState(), turn, epsilon);

      // Decrease the frequency of making random moves
      epsilon *= ep_decay;

      let boardsBlack = simInfo[0];
      let boardsWhite = simInfo[1];
      let movesBlack = simInfo[2];
      let movesWhite = simInfo[3];
      let winner = simInfo[4];

      let lenBlack = boardsBlack.length;
      let lenWhite = boardsWhite.length;

      if (winner === -1 && lenBlack !== 0) {
        // Train on all moves and board states that resulted in a win
        this.qLearning(trainer, boardsBlack, movesBlack, reward, discount, alpha, lenBlack);

        // Try to punish missed moves that stop losses
        if (JSON.stringify(boardsWhite[lenWhite - 1] !== JSON.stringify(boardsBlack[lenBlack - 1]))) {
          this.backpropagate(trainer, boardsWhite[lenWhite - 1], movesBlack[lenBlack - 1], -PUNISH);
        } else {
          this.backpropagate(trainer, boardsWhite[lenWhite - 1], movesWhite[lenWhite - 1], PUNISH);
        }
      } else if (winner === 1 && lenWhite !== 0) {
        this.qLearning(trainer, boardsWhite, movesWhite, reward, discount, alpha, lenWhite);

        if (JSON.stringify(boardsWhite[lenWhite - 1] !== JSON.stringify(boardsBlack[lenBlack - 1]))) {
          this.backpropagate(trainer, boardsBlack[lenBlack - 1], movesWhite[lenWhite - 1], -PUNISH);
        } else {
          this.backpropagate(trainer, boardsBlack[lenBlack - 1], movesBlack[lenBlack - 1], PUNISH);
        }
      }
    }

    // Download network weights as JSON file when finished training
    const networkWeights = this.net.toJSON();
    const json = JSON.stringify(networkWeights);

    var blob = new Blob([json], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "rlnet.json");
  }

  /**
   * Returns the best move in the game as determined by the engine's policy. 
   * 
   * Determining the best move involves forwarding the current game state into
   * the convolutional neural network to obtain a 400-entry move vector, where 
   * each entry is a value for a corresponding move. Then, the legal move with the
   * greatest value is returned.
   * 
   * For ONLY the rlnet.json weights trained using 3,000 games, the values assigned
   * to each move can be visualized on the board. Note that, for some unknown 
   * reason and major problem, all moves have approximately the same value (0.0025),
   * so to emphasize the relative differences in the values, the values are first
   * linearly transformed before being visualized.
   * @return The best move according to the engine's policy
   */
  async getBestMove() {
    let state = this.copyBoardState(this.controller.getBoardState());
    let legalMoves = this.controller.getLegalMoves();

    // If white move, change perspective to black's perspective since neural net
    // requires black's perspective when forwarding board input
    if (!this.controller.isBlackMove()) {
      for (let i = 0; i < this.controller.getNumRows(); i++) {
        for (let j = 0; j < this.controller.getNumCols(); j++) {
          state[i][j] *= -1;
        }
      }
    }

    // Get policy, predicted by neural network, for board state
    let prediction = this.net.forward(state).w;
    let col_length = state[0].length;

    let visualize = [];
    for (let i = 0; i < prediction.length; i++) {
      let move = [i % col_length + 1, Math.floor(i / col_length) + 1];
      //let maxQ = Math.max(...prediction);
      //let approxRelativeQ = prediction[i] / maxQ;
      //visualize.push([move, prediction[i]]);

      // Only works for rlnet.json with 3000 simulated games
      let approxRelativeQ = (prediction[i] - 0.0025) * 10000;
      visualize.push([move, approxRelativeQ]);
    }

    this.visualizeMoves(visualize);

    const timer = ms => new Promise(res => setTimeout(res, ms));
    const delay = this.visualize ? 200 : 0;
    await timer(delay);

    let move;
    // If move not legal, find next best move
    while (true) {
      let maxQ = Math.max(...prediction);
      let index = prediction.indexOf(maxQ);
      prediction[index] = -Infinity;
      move = [index % col_length + 1, Math.floor(index / col_length) + 1];

      if (this.arrayContainsArray(legalMoves, move)) {
        break;
      }
    }

    return move;
  }

  /**
   * Returns the best move as determined by the engine.
   * @return The best move evaluated by the engine
   */
  async getMove() {
    const bestMove = await this.getBestMove();
    return bestMove;
  }
}