import React from "react";
import { panelStyle } from "./styles";

export default function WarehousePanel({ data, onClose, destroyButton }) {
  const s = data.storage || {};
  const used = data.used || 0;
  const cap = data.capacity || 100;
  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong>Warehouse</strong>
        <div style={{ display: "flex", gap: 8 }}>
          {destroyButton}
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      <div>Capacity: {used}/{cap}</div>
      <div style={{ marginTop: 8 }}>
        <div>Wood: {Number(s.wood || 0).toFixed(1)}</div>
        <div>Stone: {Number(s.stone || 0).toFixed(1)}</div>
        <div>Wheat: {Number(s.wheat || 0).toFixed(1)}</div>
        <div>Fish: {Number(s.fish || 0).toFixed(1)}</div>
      </div>
    </div>
  );
}

