import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import phaserConfig from "./game/config/phaserConfig";
import Interface from "./ui/Interface";
import BuildingUI from "./ui/BuildingUI";
import EventBus from "./game/events/eventBus";

export default function App() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [uiState, setUiState] = useState({ open: false, payload: null });

  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game({
        ...phaserConfig,
        parent: containerRef.current,
      });
    }

    const offOpen = EventBus.on("open-building-ui", (payload) => {
      setUiState({ open: true, payload });
    });
    const offClose = EventBus.on("close-building-ui", () => {
      setUiState({ open: false, payload: null });
    });

    return () => {
      offOpen();
      offClose();
    };
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", height: "100vh" }}>
      <div ref={containerRef} style={{ gridRow: 1 }} />
      <Interface />
      <BuildingUI
        open={uiState.open}
        payload={uiState.payload}
        onClose={() => EventBus.emit("close-building-ui")}
      />
    </div>
  );
}
