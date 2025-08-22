import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import phaserConfig from "./game/config/phaserConfig";
import Interface from "./ui/Interface";
import BuildingUI from "./ui/BuildingUI";
import QuestUI from "./text_quests/QuestUI";
import MainMenu from "./ui/MainMenu";
import GameOver from "./ui/GameOver";
import GameWon from "./ui/GameWon";
import EventBus from "./game/events/eventBus";

export default function App() {
  const mainGameRef = useRef(null);
  const towerDefenseRef = useRef(null);
  const mainGameInstanceRef = useRef(null);
  const towerDefenseInstanceRef = useRef(null);
  const [uiState, setUiState] = useState({ open: false, payload: null });
  const [gameState, setGameState] = useState("menu"); // "menu", "playing", "gameOver"
  const [finalScore, setFinalScore] = useState(0);

    useEffect(() => {
    // Listen for game over events
    const offGameOver = EventBus.on("game-over", (score) => {
      setFinalScore(score);
      setGameState("gameOver");
    });

    // Listen for win condition events
    const offWin = EventBus.on("game-win", () => {
      setGameState("gameWon");
    });

    const offOpen = EventBus.on("open-building-ui", (payload) => {
      setUiState({ open: true, payload });
    });
    const offClose = EventBus.on("close-building-ui", () => {
      setUiState({ open: false, payload: null });
    });

    return () => {
      offOpen();
      offClose();
      offGameOver();
      offWin();
    };
  }, []);

  // Initialize games when game state changes to "playing"
  useEffect(() => {
    if (gameState === "playing" && mainGameRef.current && towerDefenseRef.current) {
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
      // Calculate dimensions based on viewport
      const calculateDimensions = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        
        // Left side: 65% width, full height
        const mainWidth = Math.floor(vw * 0.65);
        const mainHeight = vh;
        
        // Right side: 35% width, full height
        const rightWidth = Math.floor(vw * 0.35);
        const rightHeight = vh;
        
        // Interface: 35% width, 45% height
        const interfaceWidth = rightWidth;
        const interfaceHeight = Math.floor(vh * 0.45);
        
        // Tower defense: 35% width, 55% height
        const tdWidth = rightWidth;
        const tdHeight = Math.floor(vh * 0.55);

        return { mainWidth, mainHeight, rightWidth, rightHeight, interfaceWidth, interfaceHeight, tdWidth, tdHeight };
      };

      const dimensions = calculateDimensions();

      // Create main city building game
      if (!mainGameInstanceRef.current) {
        const mainConfig = {
          ...phaserConfig,
          parent: mainGameRef.current,
          scene: [phaserConfig.scene[0]], // Only MainScene
          width: dimensions.mainWidth,
          height: dimensions.mainHeight,
        };
        mainGameInstanceRef.current = new Phaser.Game(mainConfig);
      }

      // Create separate tower defense game
      if (!towerDefenseInstanceRef.current) {
        const tdConfig = {
          ...phaserConfig,
          parent: towerDefenseRef.current,
          scene: [phaserConfig.scene[1]], // Only DefenseScene
          width: dimensions.tdWidth,
          height: dimensions.tdHeight,
        };
        towerDefenseInstanceRef.current = new Phaser.Game(tdConfig);
      }

      // Set global viewport information for the tower defense scene
      const tdViewport = {
        x: 0, // Don't set this to mainWidth as it's outside the main game canvas
        y: 0, // Don't set this to interfaceHeight as it's outside the main game canvas
        w: 0, // Set to 0 since tower defense is in a separate canvas
        h: 0  // Set to 0 since tower defense is in a separate canvas
      };
      window.__tdViewport = tdViewport;

      // Also set the main game canvas reference for proper coordinate handling
      window.__mainGameCanvas = mainGameRef.current;

      // Initialize Quest System
      import("./text_quests/QuestSystem").then(({ default: QuestSystem }) => {
        const questSystem = new QuestSystem();
        questSystem.start();
        window.__questSystem = questSystem;
      });

      // Handle window resize
      const handleResize = () => {
        const newDimensions = calculateDimensions();
        
        // Update viewport - set to 0 since tower defense is in a separate canvas
        const newTdViewport = {
          x: 0,
          y: 0,
          w: 0,
          h: 0
        };
        window.__tdViewport = newTdViewport;
        
        // Update main game canvas reference
        window.__mainGameCanvas = mainGameRef.current;
      };

      window.addEventListener('resize', handleResize);
      }, 100); // 100ms delay to ensure DOM is ready
    }
  }, [gameState]);

  const startGame = () => {
    setGameState("playing");
  };

  const returnToMenu = () => {
    setGameState("menu");
    
    // Clean up quest system
    if (window.__questSystem) {
      window.__questSystem.stop();
    }
    
    // Remove resize event listener
    window.removeEventListener('resize', () => {});
    
    // Clean up game instances
    if (mainGameInstanceRef.current) {
      mainGameInstanceRef.current.destroy(true);
      mainGameInstanceRef.current = null;
    }
    if (towerDefenseInstanceRef.current) {
      towerDefenseInstanceRef.current.destroy(true);
      towerDefenseInstanceRef.current = null;
    }
  };

  // Show main menu
  if (gameState === "menu") {
    return <MainMenu onStartGame={startGame} />;
  }

  // Show game over screen
  if (gameState === "gameOver") {
    return <GameOver onReturnToMenu={returnToMenu} finalScore={finalScore} />;
  }

  // Show game won screen
  if (gameState === "gameWon") {
    return <GameWon onReturnToMenu={returnToMenu} />;
  }

  // Show main game
  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "65% 35%", 
      height: "100vh",
      width: "100vw",
      overflow: "hidden"
    }}>
      {/* Left side - Main city building game (65% width, full height) */}
      <div 
        ref={mainGameRef} 
        style={{ 
          gridColumn: 1,
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden"
        }} 
      />
      
      {/* Right side - Interface and Tower Defense (35% width, full height) */}
      <div style={{ 
        gridColumn: 2,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden"
      }}>
        {/* Top - Interface UI (45% height) */}
        <div style={{ 
          height: "45%",
          position: "relative",
          overflow: "hidden"
        }}>
          <Interface />
        </div>
        
        {/* Bottom - Tower Defense (55% height) */}
        <div style={{ 
          height: "55%",
          position: "relative",
          overflow: "hidden"
        }}>
          <div 
            ref={towerDefenseRef}
            style={{
              width: "100%",
              height: "100%"
            }}
          />
        </div>
      </div>
      
      <BuildingUI
        open={uiState.open}
        payload={uiState.payload}
        onClose={() => EventBus.emit("close-building-ui")}
      />
      
      <QuestUI />
    </div>
  );
}
