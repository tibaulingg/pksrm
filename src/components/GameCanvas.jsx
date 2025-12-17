import React, { useRef, useEffect } from "react";

import { useGame } from "../hooks/useGame.js";

/**
 * Main game canvas component
 * Renders the game canvas and manages game engine integration
 */
function GameCanvas() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const CANVAS_WIDTH = 1280;
    const CANVAS_HEIGHT = 720;

    const { engine } = useGame(canvasRef);

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
                backgroundColor: "#0d0d0eff",
                overflow: "hidden",
                padding: "16px",
                borderRadius: "8px",
                border: "2px solid #222240",
                position: "relative",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    cursor: "crosshair",
                    width: "95%",
                    height: "auto",
                    border: "1px solid #FFD700",
                    maxWidth: "100vw",
                    maxHeight: "100vh",
                    objectFit: "contain",
                }}
            />
        </div>
    );
}

export default GameCanvas;
