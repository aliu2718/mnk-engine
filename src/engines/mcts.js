import FileSaver from "file-saver";
/*******************************************************************************
 * IMPORTANT: This engine currently does not work as intended. When training the
 * network, if either the number of games to simulate or the number of MCTS
 * iterations to use exceeds 1, React will render the website multiples times, 
 * causing multiple games to be played on top of each other and errors to occur 
 * in the self-playing process. The current cause of this problem is unknown.
 *******************************************************************************/


/**
 * [MCTNode] represents a node in a Monte-Carlo Tree, consisting of a move on the
 * board, a value, the times the node was visited, a prior probability, and its
 * parent and children nodes.
 */
class MCTNode {
  /**
   * Initializes a Monte-Carlo Tree node.
   * @param {Array} move A [col, row] move
   * @param {MCTNode} parent The parent node 
   * @param {Number} prior A prior probability for making the move
   */
  constructor(move, parent, prior) {
    this.move = move;

    this.parent = parent;
    this.children = [];

    this.u = 0; // Total net value propagated to node (through backup process)
    this.n = 0; // Total number of times node was visited
    this.prior = prior; // Prior probability, determined by a policy neural net
  }

  /**
   * Adds the specified children nodes.
   * @param {Array} children An array of MCTNodes 
   */
  addChildren(children) {
    for (let i = 0; i < children.length; i++) {
      this.children.push(children[i]);
    }
  }

  /** Returns a modified upper confidence bound for trees of the node, to be used 
   *  when searching through the Monte-Carlo Tree.
   *  @return The UCT value of the node
   */
  uct(epsilon) {
    if (this.n === 0) {
      return epsilon * this.prior * Math.sqrt(this.parent.n / (this.n + 1));
    } else {
      return (1 - 0.5 * (this.u / this.n + 1)) + epsilon * this.prior * Math.sqrt(this.parent.n / (this.n + 1));
    }
  }
}

/**
 * [MonteCarloTreeSearch] simulates a modified Monte-Carlo Tree Search consisting
 * of tree search, expansion, and value backup/backpropagation. It integrates a
 * value and policy network during these steps.
 * 
 * Inspired by DeepMind's AlphaZero MCTS architecture.  
 */
class MonteCarloTreeSearch {
  /**
   * Initializes a Monte-Carlo Tree Search.
   * @param {Controller} controller The controller for the game.
   * @param {Array} state A 2d board state 
   * @param {String} turn The current turn, either "black" or "white" 
   * @param {Net} policy_net A neural network for evaluating the policy of a board state
   * @param {Net} value_net A neural network for evaluating the value of a board state
   */
  constructor(controller, state, turn, policy_net, value_net) {
    this.controller = controller;

    this.turn = turn;
    this.isGameEnd = false;
    this.init_state = structuredClone(state);
    this.root = new MCTNode(null, null, 1);
    this.node = this.root;

    this.policy_net = policy_net;
    this.value_net = value_net;
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
   * Checks if the game, with the specified board state, has ended, and returns
   * an appropriate outcome value (1 if white won, -1 if black won, and 0 otherwise).
   * @param {Number} row The row coord of a piece
   * @param {Number} col The col coord of a piece 
   * @param {Array} state The board state 
   * @returns 1 if white won, -1 if black won, and 0 otherwise
   */
  checkEndAndValue(row, col, state) {
    if (this.checkConnect(row, col, state) >= this.controller.getConnectionCriteria()) {
      this.isGameEnd = true;
      return state[col - 1][row - 1];
    } else if (this.getStateLegalMoves(state).length === 0) {
      this.isGameEnd = true;
    }

    return 0;
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
   * Returns three bit masks for black's piece locations, empty tile locations,
   * and white's piece locations for the specified state (for use in forwarding
   * a board state into a neural network).
   * @param {Array} state The board state to encode
   */
  encodeState(state) {
    let numRows = this.controller.getNumRows();
    let numCols = this.controller.getNumCols();

    let blackBitMap = new Array(numRows).fill().map(() => Array(numCols).fill(0));
    let whiteBitMap = new Array(numRows).fill().map(() => Array(numCols).fill(0));
    let emptyBitMap = new Array(numRows).fill().map(() => Array(numCols).fill(0));

    for (let row = 0; row < this.controller.getNumRows(); row++) {
      for (let col = 0; col < this.controller.getNumCols(); col++) {
        if (state[row][col] == -1) {
          blackBitMap[row][col] = 1;
        } else if (state[row][col] == 1) {
          whiteBitMap[row][col] = 1;
        } else {
          emptyBitMap[row][col] = 1;
        }
      }
    }

    return [blackBitMap, emptyBitMap, whiteBitMap]
  }

  /** 
   * Returns the best leaf node and corresponding state in the Monte-Carlo Search
   * Tree. 
   * 
   * The search algorithm begins at the tree root, then searches through each of 
   * its children to find the one with the maximal UCT value (choosing a random
   * child if multiple have the best move). The child's move is made on the board,
   * and the best child among the children of the child node is found. This process
   * is repeated until a leaf node (node with no children) is reached or the game
   * has ended.
   * @returns [node, state] corresponding to the best leaf node in the tree and
   * corresponding state
   */
  select(epsilon) {
    let node = this.root;
    let state = structuredClone(this.init_state);

    // Navigate to leaf node through "best" path of moves, then return leaf node
    // and corresponding board state
    while (node.children.length !== 0 && !this.isGameEnd) {
      // Get children of current node
      let children = node.children;

      // Find the best UCT value
      let best_value = -Infinity;
      for (let i = 0; i < children.length; i++) {
        let uct = children[i].uct(epsilon);
        if (uct > best_value && !isNaN(uct)) {
          best_value = uct;
        }
      }

      // Find all children with UCT value equal to the best value, then choose
      // one randomly
      let candidates = [];
      for (let i = 0; i < children.length; i++) {
        let uct = children[i].uct(epsilon);
        if (uct === best_value && !isNaN(uct)) {
          candidates.push(children[i]);
        }
      }
      node = candidates[Math.floor(Math.random() * candidates.length)];

      // Make the move on the board
      let [col, row] = node.move;
      state[row - 1][col - 1] = this.turn === "black" ? -1 : 1;
      this.turn = this.turn === "black" ? "white" : "black";

      // Check if a player has won or if there are no more legal moves
      this.checkEndAndValue(row, col, state);

      // If child node is a leaf node, return
      if (node.n === 0) {
        return [node, state];
      }
    }

    return [node, state];
  }

  /**
   * Expands the specified parent node in the tree.
   * 
   * A node for each legal move in the board state is created and assigned a
   * prior depending on the specified policy, and the node is assigned as a 
   * child of the parent node.
   * 
   * For the expansion step, all possible and legal child nodes are expanded.
   * @param {MCTNode} parent The parent node 
   * @param {Array} state The current board state corresponding to the node 
   * @param {Array} policy The move policy corresponding to the board state 
   */
  expand(parent, state, policy) {
    let numCols = this.controller.getNumCols();

    if (!this.isGameEnd) {
      let legalMoves = this.getStateLegalMoves(state);
      let children = [];
      for (let i = 0; i < legalMoves.length; i++) {
        // Get the probability of the legal move being made from the move policy
        let [col, row] = legalMoves[i];
        let prior = policy[numCols * (row - 1) + col - 1];

        // Create a child node
        var child = new MCTNode([col, row], parent, prior);
        children.push(child);
      }

      // Add all children
      parent.addChildren(children);
    }
  }

  /**
   * Backup the value through the path of nodes from the specified node to the 
   * tree root.
   * 
   * The value is propagated through all visited nodes for the current MCTS
   * iteration, and the value alternates between positive and negative since
   * each alternate board state is for a different player.
   * @param {MCTNode} node The node to begin propagating the value 
   * @param {Number} value The value to backup 
   */
  backup(node, value) {
    // Propagate until we propagate to root
    while (node != null) {
      node.n += 1;  // Increase the visit count of the current node
      node.u += value;  // Increase the total value of the current node
      node = node.parent; // Get parent node as current node

      value = -value; // Alternate value
    }
  }

  /**
   * Performs a modified Monte-Carlo Tree Search to obtain a policy for the 
   * specified board state.
   * 
   * For each iteration of the MCTS, the tree is searched through to get the best
   * leaf node and corresponding board state. Then, the board state is adjusted
   * appropriately so that it is in the perspective of the black player (for forwarding
   * into the neural networks).
   * 
   * Using the policy network, the policy for the (selected) board state is obtained.
   * Each index represents the probability of making the corresponding move on the 
   * board, with a higher probability representing a higher confidence in the move
   * being good. The probability of illegal moves are set to zero, and the policy
   * is renormalized so that the probabilties sum to one.
   * 
   * Using the value network, the value of the (selected) board state is obtained.
   * 
   * The leaf node is then expanded, and the value is backpropagated up the path of
   * nodes taken from the tree root.
   * @param {Array} state The board state to begin searching 
   * @param {String} turn The turn player for the state, either "black" or "white" 
   * @param {Number} num_searches The number of MCTS iterations to perform
   * @param {Number} epsilon A hyperparameter for exploration in the UCT value 
   * @returns 
   */
  search(state, turn, num_searches, epsilon) {
    this.init_state = state;
    this.turn = turn;

    let numRows = this.controller.getNumRows();
    let numCols = this.controller.getNumCols();

    for (let i = 0; i < num_searches; i++) {
      // Search through tree to get best leaf node and corresponding board state
      let [node, state] = this.select(epsilon);

      // Change to black perspective on board 
      let perspectiveState = structuredClone(state);
      if (this.turn === "white") {
        for (let i = 0; i < perspectiveState.length; i++) {
          for (let j = 0; j < perspectiveState[0].length; j++) {
            perspectiveState[i][j] *= -1;
          }
        }
      }

      // Encode state for forwarding into neural nets
      let encodedState = this.encodeState(perspectiveState);

      // Get policy using network, remove illegal moves, and renormalize
      var policy = this.policy_net.forward(encodedState).w;
      let legalMoves = this.getStateLegalMoves(perspectiveState);
      let total = 0;
      for (let i = 0; i < policy.length; i++) {
        let move = [i % numCols + 1, Math.floor(i / numRows) + 1];
        if (!this.arrayContainsArray(legalMoves, move)) {
          policy[i] = 0;
        }
        total += policy[i];
      }

      for (let i = 0; i < policy.length; i++) {
        policy[i] = policy[i] / total;
      }

      // Get value of board state
      let value = this.value_net.forward(encodedState).w;

      // Expand the leaf node
      this.expand(node, state, policy);

      // Backpropagate the value
      this.backup(node, value);
    }

    return policy;
  }
}

/**
 * [MCTSEngine] represents an engine that utilizes both Monte-Carlo Tree Search
 * and Reinforcement Learning to improve its move policy.
 * 
 * Inspired by DeepMind's AlphaZero architecture.
 */
export default class MCTSEngine {
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
      var policy_layers = [];
      var value_layers = [];

      // Create layers for the policy neural network and value neural network.
      // The number of filters is pushed nearly to its limits given the limitations
      // of ConvNetJS and React.
      policy_layers.push({ type: 'input', out_sx: 20, out_sy: 20, out_depth: 3 });
      policy_layers.push({ type: 'conv', sx: 3, filters: 8, stride: 1, pad: 1, activation: 'relu' });
      policy_layers.push({ type: 'conv', sx: 3, filters: 8, stride: 1, pad: 1, activation: 'relu' });

      value_layers.push({ type: 'input', out_sx: 20, out_sy: 20, out_depth: 3 });
      value_layers.push({ type: 'conv', sx: 3, filters: 8, stride: 1, pad: 1, activation: 'relu' });
      value_layers.push({ type: 'conv', sx: 3, filters: 8, stride: 1, pad: 1, activation: 'relu' });

      let numCols = this.controller.getNumCols();
      let numRows = this.controller.getNumRows();

      policy_layers.push({ type: 'conv', sx: 3, filters: 4, stride: 1, pad: 1, activation: 'relu' });
      policy_layers.push({ type: 'fc', num_neurons: 4 * numCols * numRows, activation: 'relu' });
      policy_layers.push({ type: 'softmax', num_classes: numCols * numRows });

      value_layers.push({ type: 'conv', sx: 3, filters: 3, stride: 1, pad: 1, activation: 'relu' });
      value_layers.push({ type: 'fc', num_neurons: 3 * numCols * numRows, activation: 'relu' });
      value_layers.push({ type: 'fc', num_neurons: 1, activation: 'tanh' });

      this.policy_net = new this.convnetjs.Net();
      this.policy_net.makeLayers(policy_layers);

      this.value_net = new this.convnetjs.Net();
      this.value_net.makeLayers(value_layers);
    } else {
      // Load an existing policy neural network and value neural network
      var policy_json = require('.//mcts/policy.json');
      var value_json = require('.//mcts/value.json');

      this.policy_net = new this.convnetjs.Net();
      this.policy_net.fromJSON(policy_json);

      this.value_net = new this.convnetjs.Net();
      this.value_net.fromJSON(value_json);
    }

    let turn = this.controller.isBlackMove ? "black" : "white";
    let state = this.controller.getBoardState();
    // Initialize the Monte-Carlo Tree Search. Can possibly be removed.
    this.mcts = new MonteCarloTreeSearch(controller, state, turn, this.policy_net, this.value_net);
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
   * Simulates a full game starting from the specified [state] and [turn].
   * 
   * The self-play process uses a Monte-Carlo Tree Search to obtain a move policy
   * for the current board state, then performs a weighted random sampling to 
   * obtain a move. The move is then made on the board.
   * 
   * Once the game has ended, the training data is prepared, consisting of each
   * board state (with perspective adjusted) that occurred during the game and
   * its corresponding policy and value.
   * @param {Array} state The board state to begin playing from 
   * @param {String} turn The first turn, either "black" or "white" 
   * @param {Number} num_iter The number of MCTS iterations to perform for each search
   * @param {Number} epsilon A hyperparameter for exploration in the UCT value  
   * @returns A training set consisting of each board state that occurred in the
   * game and its policy and value 
   */
  selfPlay(state, turn, num_iter, epsilon) {
    let col_length = state[0].length;
    let memory = [];

    // Change perspective of board if white player
    let perspectiveState = structuredClone(state);
    if (turn === "white") {
      for (let i = 0; i < perspectiveState.length; i++) {
        for (let j = 0; j < perspectiveState[0].length; j++) {
          perspectiveState[i][j] *= -1;
        }
      }
    }

    // Initialize new Monte-Carlo Tree Search
    let mcts = new MonteCarloTreeSearch(this.controller, perspectiveState, turn, this.policy_net, this.value_net);
    let iter = 0; // For debugging
    while (true) {
      // Get policy for current state through MCTS
      let policy = mcts.search(perspectiveState, turn, num_iter, epsilon);

      // Get random weighted move based on policy
      let rand = Math.random();
      let move;
      for (let i = 0; i < policy.length; i++) {
        rand -= policy[i];
        if (rand <= 0) {
          move = [i % col_length + 1, Math.floor(i / col_length) + 1];
          break;
        }
      }

      // Make move on state and save board state
      let [col, row] = move;
      perspectiveState[row - 1][col - 1] = 1;

      memory.push([this.mcts.encodeState(structuredClone(perspectiveState)), policy, turn]);

      // Check if game has ended. If it has, prepare the training data from the game
      mcts.checkEndAndValue(row, col, perspectiveState);
      if (mcts.isGameEnd) {
        let value = this.value_net.forward(perspectiveState).w;
        let training_data = [];
        for (let i = 0; i < memory.length; i++) {
          let player_value = turn === memory[i][2] ? value : -value;
          training_data.push([memory[i][0], memory[i][1], player_value]);
        }

        // For debugging
        console.log('Done');
        console.log(memory.length);
        console.log(memory[memory.length - 1][1]);

        return training_data;
      }

      // Change perspective
      for (let i = 0; i < perspectiveState.length; i++) {
        for (let j = 0; j < perspectiveState[0].length; j++) {
          perspectiveState[i][j] *= -1;
        }
      }

      turn = turn === "black" ? "white" : "black";

      // For debugging
      iter += 1;
      console.log(iter);
    }
  }

  /**
   * Trains the policy and value neural networks using self-play.
   * 
   * A specified number of games are simulated using MCTS (and the policy and
   * value nets), and for each simulated game, the training data is retrieved and
   * used to train both networks.
   * @param {Number} num_iter The number of games to simulate 
   * @param {Number} mcts_iter The number of MCTS iterations to perform during self-play
   * @param {Number} epsilon A hyperparameter for exploration in the UCT value 
   */
  train(num_iter, mcts_iter, epsilon) {
    // Trainers for the neural networks
    var policy_trainer = new this.convnetjs.Trainer(this.policy_net, {
      method: 'adadelta', l2_decay: 0.001,
      batch_size: 1
    });

    var value_trainer = new this.convnetjs.Trainer(this.value_net, {
      method: 'adadelta', l2_decay: 0.001,
      batch_size: 1
    });

    // Simulate [num_iter] number of games
    for (let i = 0; i < num_iter; i++) {
      let state = this.controller.getBoardState();
      let turn = this.controller.isBlackMove() ? "black" : "white";

      // Get training data from self-play (which uses MCTS and the neural nets)
      let training_data = this.selfPlay(state, turn, mcts_iter, epsilon);

      for (let k = 0; k < training_data.length; k++) {
        console.log(k); // Debugging

        // For each training sample, train the policy and value nets
        let train_board = new this.convnetjs.Vol(training_data[k][0]);
        policy_trainer.train(train_board, training_data[k][1]);
        value_trainer.train(train_board, training_data[k][2]);
      }
    }

    // Save final weights of both nets as JSON files after training
    const policy_json = JSON.stringify(this.policy_net.toJSON());
    const value_json = JSON.stringify(this.value_net.toJSON());

    var policy_blob = new Blob([policy_json], { type: "text/plain;charset=utf-8" });
    var value_blob = new Blob([value_json], { type: "text/plain;charset=utf-8" });

    FileSaver.saveAs(policy_blob, "policy.json");
    FileSaver.saveAs(value_blob, "value.json");
  }

  /**
   * Returns the best move in the game as determined by the engine's policy. 
   * 
   * Determining the best move involves forwarding the current game state into
   * the policy neural network to obtain a 400-entry move vector, where 
   * each entry is a value for a corresponding move. Then, the legal move with the
   * greatest value is returned.
   * @return The best move according to the engine's policy
   */
  async getBestMove() {
    let state = structuredClone(this.controller.getBoardState());
    let legalMoves = this.controller.getLegalMoves();

    if (!this.controller.isBlackMove()) {
      for (let i = 0; i < this.controller.getNumRows(); i++) {
        for (let j = 0; j < this.controller.getNumCols(); j++) {
          state[i][j] *= -1;
        }
      }
    }

    let prediction = this.policy_net.forward(state).w;
    let col_length = state[0].length;

    // Visualize policy
    let visualize = [];
    for (let i = 0; i < prediction.length; i++) {
      let move = [i % col_length + 1, Math.floor(i / col_length) + 1];
      visualize.push([move, prediction[i]]);
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

      if (this.mcts.arrayContainsArray(legalMoves, move)) {
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