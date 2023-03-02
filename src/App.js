import React from 'react';
import Controller from './components/Controller.js';
import RandomEngine from './engines/randomEngine.js';

import './App.css';

function App() {
  let controller = new Controller();

  return (
    <div className="App">
      <div id='turnText'>Black Move</div>

      {controller.setEngine('black', new RandomEngine(controller))}
      {controller.setEngine('white', null)}

      {controller.renderBoard()}

      <div id='moveList'>Moves<br /></div>
    </div>
  );
}

export default App;
