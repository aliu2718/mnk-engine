import React from 'react';
import Controller from './components/Controller.js';

import RandomEngine from './engines/randomEngine.js';
import MinimaxEngine from './engines/minimaxEngine.js';
import ReinforcementLearningEngine from './engines/rlEngine.js';
import MonteCarloTreeSearch from './engines/mcts.js';
import MCTSEngine from './engines/mcts.js';

import './App.css';


function App() {
  let controller = new Controller();

  // FOR TRAINING MONTE-CARLO TREE SEARCH AND REINFORCEMENT LEARNING ENGINES
  //let mcts = new MCTSEngine(controller, false, false);
  //mcts.train(1, 1, 2);
  //let rlnet = new ReinforcementLearningEngine(controller, false, false);
  //rlnet.train(100, 100, 0.5, 0.4, 0.6, 0.4);

  return (
    <div className="App">
      <section>
        <div id="board-style">
          {controller.renderBoard()}
        </div>

        {controller.setEngine('black', new ReinforcementLearningEngine(controller, true, true))}
        {/* {controller.setEngine('black', new MCTSEngine(controller, true, true))} */}
        {controller.setEngine('white', new ReinforcementLearningEngine(controller, false, true))}

        <div id="content-style">
          <div id='turnText'>Black Move</div>
          <div id='moveList'>Moves<br /></div>
        </div>

      </section >



    </div >
  );
}

export default App;

{/* <div>
<button type="submit" onClick={controller.refreshPage}>New Game</button>
</div> */}
