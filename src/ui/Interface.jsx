import React, { useEffect, useMemo, useState } from "react";
import GameModel from "../game/core/GameModel";
import Pointer from "../game/core/Pointer";
import { BUILDING_COSTS, BUILDING_TYPES } from "../game/core/constants";

// Import images for buildings
import house_img from "../assets/buildings_img/house.png";
import farm_img from "../assets/buildings_img/farm.png";
import lumber_img from "../assets/buildings_img/lumber.png";
import training_img from "../assets/buildings_img/training.png";

export default function Interface() {
  const [tab, setTab] = useState("construction");
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 12,
        zIndex: 1000,
        fontFamily: "sans-serif",
        color: "#fff",
      }}
    >
      <TabBar tab={tab} setTab={setTab} />
      {tab === "construction" && <ConstructionPanel />}
      {tab === "people" && <PeoplePanel />}
      {tab === "resources" && <ResourcesPanel />}
    </div>
  );
}

function TabBar({ tab, setTab }) {
  const tabs = [
    { key: "construction", label: "Construction" },
    { key: "people", label: "People" },
    { key: "resources", label: "Resources" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: tab === t.key ? "1px solid #4caf50" : "1px solid #444",
            background: tab === t.key ? "#2e7d32" : "#222",
            color: "#fff",
            cursor: "pointer",
            minWidth: 140,
            fontWeight: 600,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function PanelContainer({ children, title }) {
  return (
    <div
      style={{
        width: 720,
        maxWidth: "calc(100vw - 24px)",
        background: "rgba(20,20,20,0.92)",
        border: "1px solid #444",
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ConstructionPanel() {
  const items = [
    { key: BUILDING_TYPES.HOUSE, label: "House", img: house_img },
    {
      key: BUILDING_TYPES.TRAINING_CENTER,
      label: "Training Center",
      img: training_img,
    },
    { key: BUILDING_TYPES.FARM, label: "Farm", img: farm_img },
    {
      key: BUILDING_TYPES.LUMBERYARD,
      label: "Lumberyard",
      img: lumber_img,
    },
  ];
  const canAfford = (key) => GameModel.gold >= (BUILDING_COSTS[key] || 0);
  const onPick = (key) => {
    if (!canAfford(key)) return;
    Pointer.setSelected(window.__phaserScene, key);
  };
  return (
    <PanelContainer title="Construction">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {items.map((it) => (
          <div
            key={it.key}
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr auto",
              alignItems: "center",
              gap: 10,
              padding: 10,
              background: "#1a1a1a",
              borderRadius: 8,
              border: "1px solid #333",
              opacity: canAfford(it.key) ? 1 : 0.7,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                border: "1px solid #333",
              }}
            >
              <img
                src={it.img}
                width={48}
                height={48}
                style={{ imageRendering: "pixelated", objectFit: "cover" }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{it.label}</div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>
                Cost: {BUILDING_COSTS[it.key] || 0}g
              </div>
            </div>
            <button
              onClick={() => onPick(it.key)}
              disabled={!canAfford(it.key)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: canAfford(it.key) ? "#2e7d32" : "#333",
                border: canAfford(it.key)
                  ? "1px solid #3fa143"
                  : "1px solid #555",
                color: "#fff",
                cursor: canAfford(it.key) ? "pointer" : "default",
              }}
              title={canAfford(it.key) ? "Place building" : "Not enough gold"}
            >
              Place
            </button>
          </div>
        ))}
      </div>
    </PanelContainer>
  );
}

function PeoplePanel() {
  const p = GameModel.population;
  const { villager, farmerEmployed, foresterEmployed, villagerEmployed } =
    useMemo(() => {
      const grid = GameModel.gridData || [];
      let totalVillagers = 0;
      let eVillager = 0;
      let eFarmer = 0;
      let eForester = 0;
      for (let y = 0; y < grid.length; y++) {
        const row = grid[y];
        if (!row) continue;
        for (let x = 0; x < (row?.length || 0); x++) {
          const cell = row[x];
          if (
            cell?.buildingType === BUILDING_TYPES.HOUSE &&
            cell.root === cell
          ) {
            totalVillagers += cell.villagers || 0;
            eVillager += cell.employed?.villager || 0;
            eFarmer += cell.employed?.farmer || 0;
            eForester += cell.employed?.forester || 0;
          }
        }
      }
      return {
        villager: totalVillagers,
        villagerEmployed: eVillager,
        farmerEmployed: eFarmer,
        foresterEmployed: eForester,
      };
    }, [GameModel.gridData, GameModel.population.current]);

  const farmerTotal = GameModel.professions.farmer || 0;
  const foresterTotal = GameModel.professions.forester || 0;

  const villagerUnemp = Math.max(0, (villager || 0) - (villagerEmployed || 0));
  const farmerUnemp = Math.max(0, (farmerTotal || 0) - (farmerEmployed || 0));
  const foresterUnemp = Math.max(
    0,
    (foresterTotal || 0) - (foresterEmployed || 0)
  );

  return (
    <PanelContainer title="People Management">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <PeopleStat
          icon="👥"
          label="Population"
          value={`${p.current}/${p.cap}`}
          sub={"Total / Cap"}
        />
        <PeopleStat
          icon="🧑"
          label="Villagers"
          value={String(villager)}
          sub={`Empl: ${villagerEmployed}  Unempl: ${villagerUnemp}`}
        />
        <PeopleStat
          icon="👨‍🌾"
          label="Farmers"
          value={String(farmerTotal)}
          sub={`Empl: ${farmerEmployed}  Unempl: ${farmerUnemp}`}
        />
        <PeopleStat
          icon="🌲"
          label="Foresters"
          value={String(foresterTotal)}
          sub={`Empl: ${foresterEmployed}  Unempl: ${foresterUnemp}`}
        />
      </div>
    </PanelContainer>
  );
}

function PeopleStat({ icon, label, value, sub }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: 8,
        padding: 10,
      }}
    >
      <div style={{ fontSize: 26, width: 34, textAlign: "center" }}>{icon}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 700 }}>{label}</div>
        <div style={{ opacity: 0.85 }}>{value}</div>
        {sub ? (
          <div style={{ opacity: 0.7, fontSize: 13, marginTop: 2 }}>{sub}</div>
        ) : null}
      </div>
    </div>
  );
}

function ResourcesPanel() {
  const res = GameModel.resources || {};
  const items = [
    { key: "wood", label: "Wood", value: res.wood || 0, icon: "🪵" },
    { key: "wheat", label: "Wheat", value: res.wheat || 0, icon: "🌾" },
  ];
  return (
    <PanelContainer title="Resources">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {items.map((it) => (
          <div
            key={it.key}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 26, width: 34, textAlign: "center" }}>
              {it.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{it.label}</div>
              <div style={{ opacity: 0.85 }}>{Number(it.value).toFixed(1)}</div>
            </div>
          </div>
        ))}
      </div>
    </PanelContainer>
  );
}
