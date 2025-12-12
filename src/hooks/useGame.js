import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine.js';

/**
 * Custom React hook for managing game engine lifecycle
 * Handles initialization, start/stop, and cleanup
 * 
 * @param {React.RefObject} canvasRef - Reference to canvas element
 * @param {string} selectedCharacter - Selected character type
 * @returns {Object} Game engine reference and control methods
 */
export function useGame(canvasRef, selectedCharacter) {
  const engineRef = useRef(null);

  useEffect(() => {
    // Only initialize if canvas is available and character is selected
    if (!canvasRef.current || !selectedCharacter) return;

    // Create game engine instance with selected character
    const engine = new GameEngine(canvasRef.current, selectedCharacter);
    engineRef.current = engine;

    // Start game loop
    engine.start();

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [canvasRef, selectedCharacter]);

  return {
    engine: engineRef.current,
    restart: () => engineRef.current?.restart(),
    togglePause: () => engineRef.current?.togglePause(),
    stop: () => engineRef.current?.stop(),
    start: () => engineRef.current?.start(),
  };
}
