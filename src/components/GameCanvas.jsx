import React, { useRef, useEffect, useState } from "react";

import { useGame } from "../hooks/useGame.js";
import CharacterSelectOverlay from "./CharacterSelectOverlay.jsx";

/**
 * Main game canvas component
 * Renders the game canvas and manages game engine integration
 */
function GameCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(true);

  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;

  const { engine } = useGame(canvasRef, selectedCharacter);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = CANVAS_WIDTH;
      canvasRef.current.height = CANVAS_HEIGHT;
      if (engine) {
        engine.resize(CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }
  }, [engine]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f0f1e",
        overflow: "hidden",
        padding: "16px",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          cursor: "crosshair",
          width: "100%",
          height: "auto",
          maxWidth: "100vw",
          maxHeight: "100vh",
          objectFit: "contain",
        }}
      />
      {showCharacterSelect && (
        <CharacterSelectOverlay
          onSelectCharacter={(character) => {
            setSelectedCharacter(character);
            setShowCharacterSelect(false);
          }}
        />
      )}
    </div>
  );
}

export default GameCanvas;
