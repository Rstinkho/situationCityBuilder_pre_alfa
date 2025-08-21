import React from "react";
import { panelStyle } from "./styles";

export default function WarehousePanel({ data, onClose, destroyButton }) {
  const s = data.storage || {};
  const used = data.used || 0;
  const cap = data.capacity || 100;
  const usagePercent = Math.round((used / cap) * 100);
  
  // Calculate individual resource percentages for visual bars
  const getResourceBar = (resource, value) => {
    const maxWidth = 120;
    const width = Math.max(2, (value / cap) * maxWidth);
    const color = value > 0 ? "#4CAF50" : "#666";
    
    return (
      <div key={resource} style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ textTransform: "capitalize" }}>{resource}:</span>
          <span>{Number(value || 0).toFixed(1)}</span>
        </div>
        <div style={{ 
          width: maxWidth, 
          height: 8, 
          background: "#333", 
          borderRadius: 4,
          overflow: "hidden"
        }}>
          <div style={{ 
            width: width, 
            height: "100%", 
            background: color,
            transition: "width 0.3s ease"
          }} />
        </div>
      </div>
    );
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <strong style={{ fontSize: 16 }}>🏗️ Warehouse</strong>
        <div style={{ display: "flex", gap: 8 }}>
          {destroyButton}
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      
      <div style={{ 
        background: "#1a1a1a", 
        padding: 10, 
        borderRadius: 6, 
        marginBottom: 12,
        border: "1px solid #333"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span>Capacity:</span>
          <span style={{ fontWeight: "bold" }}>{used.toFixed(1)}/{cap}</span>
        </div>
        <div style={{ 
          width: "100%", 
          height: 12, 
          background: "#333", 
          borderRadius: 6,
          overflow: "hidden"
        }}>
          <div style={{ 
            width: `${usagePercent}%`, 
            height: "100%", 
            background: usagePercent > 80 ? "#f44336" : usagePercent > 60 ? "#ff9800" : "#4CAF50",
            transition: "width 0.3s ease, background-color 0.3s ease"
          }} />
        </div>
        <div style={{ textAlign: "center", fontSize: 12, opacity: 0.8, marginTop: 4 }}>
          {usagePercent}% full
        </div>
      </div>
      
      <div style={{ 
        background: "#1a1a1a", 
        padding: 10, 
        borderRadius: 6,
        border: "1px solid #333"
      }}>
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>Resources:</div>
        {getResourceBar("wood", s.wood || 0)}
        {getResourceBar("stone", s.stone || 0)}
        {getResourceBar("wheat", s.wheat || 0)}
        {getResourceBar("fish", s.fish || 0)}
      </div>
    </div>
  );
}

