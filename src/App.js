import React from 'react';
import Controller from './components/Controller.js';
import RandomEngine from './engines/randomEngine.js';

import './App.css';

function App() {
  let controller = new Controller();

  return (
    <div className="App">
      <section>
        <div id="board-style">
          {controller.renderBoard()}
        </div>

        {controller.setEngine('black', new RandomEngine(controller, true))}
        {controller.setEngine('white', new RandomEngine(controller, true))}

        <div id="content-style">
          <div id='turnText'>Black Move</div>
          <div id='moveList'>Moves<br /></div>
        </div>

        <div>
        <button onClick={controller.refreshPage}>New Game</button>
      </div>
      
      </section>
    </div>
  );
}

export default App;
