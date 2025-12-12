import React from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import './App.css';

/**
 * Main App component
 * Renders the game canvas
 */
function App() {
  return (
    <div className="App">
      <GameCanvas />
    </div>
  );
}

export default App;
