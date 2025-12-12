import React from "react";
import { PLAYER_CONFIG } from "../game/entities/playerConfig.js";
import piplupProfile from "../sprites/piplup/profile.png";
import turtwigProfile from "../sprites/turtwig/profile.png";
import chimcharProfile from "../sprites/chimchar/profile.png";

const profileImages = {
  piplup: piplupProfile,
  turtwig: turtwigProfile,
  chimchar: chimcharProfile,
};

function CharacterSelectOverlay({ onSelectCharacter }) {
  // Overlay style: absolute, centré, semi-transparent, façon upgrade
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0,0,0,0.7)",
        zIndex: 10,
      }}
    >
      <h1
        style={{
          color: "#FFD700",
          fontSize: 36,
          marginBottom: 8,
          textShadow: "0 0 20px #FFD70099",
        }}
      >
        CHOOSE YOUR CHARACTER
      </h1>
      <div style={{ display: "flex", gap: 32 }}>
        {Object.entries(PLAYER_CONFIG).map(([characterType, config]) => (
          <button
            key={characterType}
            onClick={() => onSelectCharacter(characterType)}
            style={{
              background: "#181830",
              border: `3px solid ${config.dominantColor}`,
              borderRadius: 16,
              padding: 18,
              width: 180,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: `0 0 24px ${config.dominantColor}40`,
              marginBottom: 8,
              transition: "transform 0.2s",
            }}
          >
            <img
              src={profileImages[characterType]}
              alt={config.name}
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                marginBottom: 10,
                border: `2px solid ${config.dominantColor}`,
              }}
            />
            <span
              style={{
                color: config.dominantColor,
                fontWeight: "bold",
                fontSize: 20,
                marginBottom: 6,
              }}
            >
              {config.name}
            </span>
            <div style={{ color: "#fff", fontSize: 12, marginBottom: 4 }}>
              <div>Vie : {Math.round(100 * config.stats.health)}</div>
              <div>Vitesse : {Math.round(config.stats.speed * 100)}</div>
              <div>Dégâts : {Math.round(config.stats.damage * 100)}</div>
            </div>
            <span
              style={{
                color: config.dominantColor,
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Choisir
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CharacterSelectOverlay;
