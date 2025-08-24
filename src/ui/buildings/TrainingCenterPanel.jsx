import React, { useState, useEffect } from "react";
import EventBus from "../../game/events/eventBus";
import * as TrainingCenter from "../../buildings_logic/training_center";
import { panelStyle, btnMinimal, btnMinimalSecondary, btnMinimalSmall, btnMinimalDisabled } from "./styles";

export default function TrainingCenterPanel({ data, onClose, destroyButton }) {
  const [progress, setProgress] = useState(data.trainingProgress || {});
  
  // Update progress every 100ms for smooth animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress({ ...data.trainingProgress });
    }, 100);
    
    return () => clearInterval(interval);
  }, [data.trainingProgress]);

  const handleTraining = (profession) => {
    if (data.availableVillagers > 0) {
      const result = TrainingCenter.startTraining(data, profession);
      if (!result) {
        // Training failed to start (no available villagers)
        console.log("Training failed to start - no available villagers");
      }
    }
  };

  const isTraining = (profession) => progress[profession] !== undefined;
  const getProgress = (profession) => progress[profession] || 0;

  return (
    <div style={panelStyle}>
      {/* Compact Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>🎓</span>
          <strong style={{ fontSize: 14 }}>Training Center</strong>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {destroyButton}
          <button 
            onClick={onClose}
            style={{
              ...btnMinimalSecondary,
              width: "auto",
              padding: "4px 6px",
              margin: 0,
              fontSize: 10,
            }}
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Compact Available Villagers */}
      <div style={{ 
        marginBottom: 8, 
        padding: "6px 8px",
        background: "#1a1a1a",
        borderRadius: 6,
        border: "1px solid #333",
        textAlign: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 2 }}>
          <span style={{ fontSize: 14 }}>👥</span>
          <span style={{ fontSize: 10, opacity: 0.8 }}>Available:</span>
        </div>
        <strong style={{ fontSize: 16, color: "#4caf50" }}>{data.availableVillagers ?? 0}</strong>
      </div>

      {/* Compact Training Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8 }}>
        {data.actions.map((action) => {
          const training = isTraining(action.key);
          const progressValue = getProgress(action.key);
          
          return (
            <div key={action.key} style={{ position: "relative" }}>
              <button
                style={{
                  ...(training ? btnMinimalDisabled : btnMinimal),
                  padding: "8px 6px",
                  margin: 0,
                  background: training ? "#1a1a1a" : "#2e7d32",
                  border: training ? "1px solid #444" : "1px solid #4caf50",
                  color: training ? "#666" : "#fff",
                  cursor: training ? "default" : "pointer",
                  position: "relative",
                  overflow: "hidden",
                  fontSize: 10,
                }}
                disabled={training || data.availableVillagers === 0}
                onClick={() => handleTraining(action.key)}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 16 }}>{action.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 600 }}>{action.label}</span>
                </div>
                
                {training && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "2px",
                    background: "#4caf50",
                    width: `${progressValue}%`,
                    transition: "width 0.1s ease",
                  }} />
                )}
              </button>
              
              {training && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(0,0,0,0.9)",
                  color: "#fff",
                  padding: "1px 4px",
                  borderRadius: 3,
                  fontSize: 9,
                  fontWeight: "bold",
                  zIndex: 10,
                }}>
                  {Math.round(progressValue)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact Info Section */}
      <div style={{ 
        padding: "6px 8px",
        background: "#1a1a1a",
        borderRadius: 6,
        border: "1px solid #333",
        fontSize: 10,
        opacity: 0.8,
        lineHeight: 1.3,
        textAlign: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 2 }}>
          <span style={{ fontSize: 12 }}>ℹ️</span>
          <strong>Training Info</strong>
        </div>
        <div style={{ fontSize: 9 }}>
          Removes 1 villager, keeps population same. Takes 5 seconds.
        </div>
      </div>
    </div>
  );
}

