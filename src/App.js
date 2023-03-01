import React from 'react';
import Controller from './components/Controller.js';

import './App.css';

function App() {
  let controller = new Controller();

  return (
    <div className="App">
      Engine
      {controller.renderBoard()}
    </div>
  );
}

export default App;
