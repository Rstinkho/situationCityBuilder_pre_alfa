import React from "react";
import { panelStyle } from "./styles";

export default function HousePanel({ data, onClose, destroyButton }) {
  const incomeText =
    data.incomePerInterval > 0
      ? `+${data.incomePerInterval} gold every ${Math.round(
          data.incomeIntervalMs / 1000
        )}s`
      : `No income until full`;
  return (
    <div style={panelStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <strong>House</strong>
        <div style={{ display: "flex", gap: 8 }}>
          {destroyButton}
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      <div>
        Occupants: {data.occupants}/{data.capacity}
      </div>
      <div>
        Villagers: {data.villagers} &nbsp; Farmers: {data.farmers} &nbsp;
        Foresters: {data.foresters} &nbsp; Miners: {data.miners} &nbsp; Fishermen: {data.fishermen}
      </div>
      <div>Income: {incomeText}</div>
    </div>
  );
}

