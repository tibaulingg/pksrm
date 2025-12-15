import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine.js';

/**
 * Custom React hook for managing game engine lifecycle
 * Handles initialization, start/stop, and cleanup
 * 
 * @param {React.RefObject} canvasRef - Reference to canvas element
 * @returns {Object} Game engine reference and control methods
 */
export function useGame(canvasRef) {
  const engineRef = useRef(null);

  useEffect(() => {
    // Only initialize if canvas is available
    if (!canvasRef.current) return;

    // Create game engine instance (character selection is handled by the engine)
    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Start game loop
    engine.start();

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, [canvasRef]);

  return {
    engine: engineRef.current,
    restart: () => engineRef.current?.restart(),
    togglePause: () => engineRef.current?.togglePause(),
    stop: () => engineRef.current?.stop(),
    start: () => engineRef.current?.start(),
  };
}
