import React, { useEffect, useMemo, useState } from "react";
import GameModel from "../game/core/GameModel";
import Pointer from "../game/core/Pointer";
import {
  BUILDING_COSTS,
  BUILDING_TYPES,
  TILE_TYPES,
} from "../game/core/constants";
import Grid from "../game/core/Grid";
import { saveTilesToSupabase } from "../utils/supabase";
import EventBus from "../game/events/eventBus";

import house_img from "../assets/buildings_img/house.png";
import training_img from "../assets/buildings_img/training.png";
import farm_img from "../assets/buildings_img/farm.png";
import lumber_img from "../assets/buildings_img/lumber.png";

export default function Interface() {
  const [tab, setTab] = useState("construction");
  const [adminMode, setAdminMode] = useState(false);
  const [adminTileType, setAdminTileType] = useState(null);
  const [, setTick] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  // Listen for building selection changes
  useEffect(() => {
    const checkSelection = () => {
      // Check for city building selection
      if (window.__phaserScene && Pointer.selected) {
        setSelectedBuilding(Pointer.selected);
      }
      // Check for defense building selection
      else if (window.__tdPlaceTower && window.__tdTowerType) {
        setSelectedBuilding(window.__tdTowerType);
      }
      // No building selected
      else {
        setSelectedBuilding(null);
      }
    };

    // Check selection every 100ms
    const intervalId = setInterval(checkSelection, 100);

    // Also listen for building completion events
    const unsubscribe = EventBus.on("building-completed", () => {
      setSelectedBuilding(null);
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "8px",
        fontFamily: "sans-serif",
        color: "#fff",
        overflow: "auto",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TabBar tab={tab} setTab={setTab} />
      <div style={{ flex: 1, overflowX: "hidden", overflowY: "auto" }}>
        {tab === "construction" && (
          <ConstructionPanel selectedBuilding={selectedBuilding} />
        )}
        {tab === "people" && <PeoplePanel />}
        {tab === "resources" && <ResourcesPanel />}
        {tab === "admin" && (
          <AdminPanel
            adminMode={adminMode}
            setAdminMode={setAdminMode}
            adminTileType={adminTileType}
            setAdminTileType={adminTileType}
          />
        )}
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }) {
  const tabs = [
    { key: "construction", label: "Construction" },
    { key: "people", label: "People" },
    { key: "resources", label: "Resources" },
    { key: "admin", label: "Admin" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          style={{
            padding: "6px 8px",
            borderRadius: 4,
            border: tab === t.key ? "1px solid #4caf50" : "1px solid #444",
            background: tab === t.key ? "#2e7d32" : "#222",
            color: "#fff",
            cursor: "pointer",
            minWidth: 80,
            fontWeight: 600,
            fontSize: 11,
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
        width: "100%",
        maxWidth: "97%",
        background: "rgba(20,20,20,0.92)",
        // border: "1px solid #444",
        borderRadius: 8,
        padding: 8,
        fontSize: 13,
        marginBottom: 8,
        maxHeight: "100%",
        overflow: "hidden",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
        {title}
      </div>
      <div style={{ overflow: "auto", maxHeight: "calc(100% - 30px)" }}>
        {children}
      </div>
    </div>
  );
}

function ConstructionPanel({ selectedBuilding }) {
  const [constructionTab, setConstructionTab] = useState("city");

  const cityBuildingItems = useMemo(
    () => [
      {
        key: BUILDING_TYPES.HOUSE,
        label: "House",
        img: house_img,
        hasImage: true,
      },
      {
        key: BUILDING_TYPES.TRAINING_CENTER,
        label: "Training Center",
        img: training_img,
        hasImage: true,
      },
      {
        key: BUILDING_TYPES.FARM,
        label: "Farm",
        img: farm_img,
        hasImage: true,
      },
      {
        key: BUILDING_TYPES.LUMBERYARD,
        label: "Lumberyard",
        img: lumber_img,
        hasImage: true,
      },
      {
        key: BUILDING_TYPES.QUARRY,
        label: "Quarry",
        img: "⛏️",
        hasImage: false,
      },
      {
        key: BUILDING_TYPES.FISHERMAN_HUT,
        label: "Fisherman Hut",
        img: "🎣",
        hasImage: false,
      },
      {
        key: BUILDING_TYPES.WAREHOUSE,
        label: "Warehouse",
        img: "🏗️",
        hasImage: false,
      },
    ],
    []
  );

  const defenseItems = useMemo(
    () => [
      { key: BUILDING_TYPES.TOWER, label: "Tower", img: "🏹", isDefense: true },
    ],
    []
  );

  const canAfford = (key) => {
    if (key === BUILDING_TYPES.TOWER)
      return GameModel.gold >= (BUILDING_COSTS[key] || 0);
    return GameModel.gold >= (BUILDING_COSTS[key] || 0);
  };

  const onPick = (key, isDefense = false) => {
    if (!canAfford(key)) return;

    if (isDefense) {
      // Handle defense building placement - communicate directly with DefenseScene
      window.__tdPlaceTower = true;
      window.__tdTowerType = key;
      // Set cursor for the defense scene
      if (window.__defenseScene) {
        window.__defenseScene.input.setDefaultCursor("crosshair");
      }
    } else {
      // Handle city building placement
      Pointer.setSelected(window.__phaserScene, key);
    }
  };

  const BuildingItem = ({ item, isDefense = false }) => {
    const isSelected = selectedBuilding === item.key;
    const [isHovered, setIsHovered] = useState(false);

    const getBackgroundColor = () => {
      if (isSelected) return "#2e7d32";
      if (isHovered && canAfford(item.key)) return "#2a2a2a";
      return "#1a1a1a";
    };

    const getBorderColor = () => {
      if (isSelected) return "#4caf50";
      if (isHovered && canAfford(item.key)) return "#555";
      return "#333";
    };

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          padding: 6,
          background: getBackgroundColor(),
          borderRadius: 6,
          border: isSelected
            ? "2px solid #4caf50"
            : `1px solid ${getBorderColor()}`,
          opacity: canAfford(item.key) ? 1 : 0.7,
          textAlign: "center",
          boxShadow: isSelected ? "0 0 8px rgba(76, 175, 80, 0.5)" : "none",
          transition: "all 0.2s ease",
          cursor: canAfford(item.key) ? "pointer" : "default",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
            border: "1px solid #333",
          }}
        >
          {isDefense ? (
            <div style={{ fontSize: 24 }}>{item.img}</div>
          ) : item.hasImage ? (
            <img
              src={item.img}
              width={32}
              height={32}
              style={{ imageRendering: "pixelated", objectFit: "cover" }}
              onError={(e) => {
                // Fallback to emoji if image fails to load
                e.target.style.display = "none";
                const fallback =
                  e.target.parentNode.querySelector(".fallback-emoji");
                if (fallback) fallback.style.display = "block";
              }}
            />
          ) : (
            <div style={{ fontSize: 24 }}>{item.img}</div>
          )}
          {/* Fallback emoji for failed images */}
          {!isDefense && item.hasImage && (
            <div
              className="fallback-emoji"
              style={{
                display: "none",
                fontSize: 24,
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.key === BUILDING_TYPES.HOUSE
                ? "🏠"
                : item.key === BUILDING_TYPES.TRAINING_CENTER
                ? "🎓"
                : item.key === BUILDING_TYPES.FARM
                ? "🌾"
                : item.key === BUILDING_TYPES.LUMBERYARD
                ? "🪵"
                : "🏠"}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 11 }}>{item.label}</div>
          <div style={{ opacity: 0.85, marginTop: 1, fontSize: 9 }}>
            Cost: {`${BUILDING_COSTS[item.key] || 0}g`}
          </div>
        </div>
        <button
          onClick={() => onPick(item.key, isDefense)}
          disabled={!canAfford(item.key)}
          style={{
            padding: "4px 6px",
            borderRadius: 4,
            background: canAfford(item.key) ? "#2e7d32" : "#333",
            border: canAfford(item.key)
              ? "1px solid #3fa143"
              : "1px solid #555",
            color: "#fff",
            cursor: canAfford(item.key) ? "pointer" : "default",
            fontSize: 10,
            minWidth: 50,
          }}
          title={canAfford(item.key) ? "Place building" : "Not enough gold"}
        >
          Place
        </button>
      </div>
    );
  };

  const ConstructionTabBar = () => (
    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
      <button
        onClick={() => setConstructionTab("city")}
        style={{
          padding: "6px 10px",
          borderRadius: 4,
          border:
            constructionTab === "city" ? "1px solid #4caf50" : "1px solid #444",
          background: constructionTab === "city" ? "#2e7d32" : "#222",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 11,
        }}
      >
        🏗️ City Building
      </button>
      <button
        onClick={() => setConstructionTab("defense")}
        style={{
          padding: "6px 10px",
          borderRadius: 4,
          border:
            constructionTab === "defense"
              ? "1px solid #f44336"
              : "1px solid #444",
          background: constructionTab === "defense" ? "#d32f2f" : "#222",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 11,
        }}
      >
        🛡️ Defense
      </button>
    </div>
  );

  return (
    <PanelContainer title="Construction">
      <ConstructionTabBar />

      {constructionTab === "city" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 6,
          }}
        >
          {cityBuildingItems.map((item) => (
            <BuildingItem key={item.key} item={item} isDefense={false} />
          ))}
        </div>
      )}

      {constructionTab === "defense" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
          }}
        >
          {defenseItems.map((item) => (
            <BuildingItem key={item.key} item={item} isDefense={true} />
          ))}
        </div>
      )}
    </PanelContainer>
  );
}

function PeoplePanel() {
  const p = GameModel.population;
  const {
    villager,
    farmerEmployed,
    foresterEmployed,
    minerEmployed,
    fishermanEmployed,
    villagerEmployed,
  } = useMemo(() => {
    const grid = GameModel.gridData || [];
    let totalVillagers = 0;
    let eVillager = 0;
    let eFarmer = 0;
    let eForester = 0;
    let eMiner = 0;
    let eFisherman = 0;
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      if (!row) continue;
      for (let x = 0; x < (row?.length || 0); x++) {
        const cell = row[x];
        if (cell?.buildingType === BUILDING_TYPES.HOUSE && cell.root === cell) {
          totalVillagers += cell.villagers || 0;
          eVillager += cell.employed?.villager || 0;
          eFarmer += cell.employed?.farmer || 0;
          eForester += cell.employed?.forester || 0;
          eMiner += cell.employed?.miner || 0;
          eFisherman += cell.employed?.fisherman || 0;
        }
      }
    }
    return {
      villager: totalVillagers,
      villagerEmployed: eVillager,
      farmerEmployed: eFarmer,
      foresterEmployed: eForester,
      minerEmployed: eMiner,
      fishermanEmployed: eFisherman,
    };
  }, [GameModel.gridData, GameModel.population.current]);

  const farmerTotal = GameModel.professions.farmer || 0;
  const foresterTotal = GameModel.professions.forester || 0;
  const minerTotal = GameModel.professions.miner || 0;
  const fishermanTotal = GameModel.professions.fisherman || 0;

  const villagerUnemp = Math.max(0, (villager || 0) - (villagerEmployed || 0));
  const farmerUnemp = Math.max(0, (farmerTotal || 0) - (farmerEmployed || 0));
  const foresterUnemp = Math.max(
    0,
    (foresterTotal || 0) - (foresterEmployed || 0)
  );
  const minerUnemp = Math.max(0, (minerTotal || 0) - (minerEmployed || 0));
  const fishermanUnemp = Math.max(
    0,
    (fishermanTotal || 0) - (fishermanEmployed || 0)
  );

  return (
    <PanelContainer title="People Management">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 6,
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
        <PeopleStat
          icon="⛏️"
          label="Miners"
          value={String(minerTotal)}
          sub={`Empl: ${minerEmployed}  Unempl: ${minerUnemp}`}
        />
        <PeopleStat
          icon="🎣"
          label="Fishermen"
          value={String(fishermanTotal)}
          sub={`Empl: ${fishermanEmployed}  Unempl: ${fishermanUnemp}`}
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
        gap: 6,
        alignItems: "center",
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: 6,
        padding: 6,
      }}
    >
      <div style={{ fontSize: 16, width: 24, textAlign: "center" }}>{icon}</div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          flex: 1,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 11 }}>{label}</div>
        <div style={{ opacity: 0.85, fontSize: 10 }}>{value}</div>
        {sub ? (
          <div style={{ opacity: 0.7, fontSize: 9, marginTop: 1 }}>{sub}</div>
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
    { key: "stone", label: "Stone", value: res.stone || 0, icon: "🪨" },
    { key: "fish", label: "Fish", value: res.fish || 0, icon: "🐟" },
  ];
  const warehouses = collectWarehouses();
  const whTotals = sumWarehouseResources(warehouses);
  const productionTotals = collectProductionBuildingResources();
  return (
    <PanelContainer title="Resources">
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 6,
            padding: 6,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 11 }}>
            Global resources
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 6,
            }}
          >
            {items.map((it) => (
              <div
                key={it.key}
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: 4,
                  padding: 4,
                }}
              >
                <div style={{ fontSize: 16, width: 20, textAlign: "center" }}>
                  {it.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 10 }}>
                    {it.label}
                  </div>
                  <div style={{ opacity: 0.85, fontSize: 9 }}>
                    {Number(it.value).toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 6,
            padding: 6,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 11 }}>
            Inside warehouses
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 6,
            }}
          >
            {[
              { key: "wood", label: "Wood", icon: "🪵" },
              { key: "wheat", label: "Wheat", icon: "🌾" },
              { key: "stone", label: "Stone", icon: "🪨" },
              { key: "fish", label: "Fish", icon: "🐟" },
            ].map((it) => (
              <div
                key={it.key}
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: 4,
                  padding: 4,
                }}
              >
                <div style={{ fontSize: 16, width: 20, textAlign: "center" }}>
                  {it.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 10 }}>
                    {it.label}
                  </div>
                  <div style={{ opacity: 0.85, fontSize: 9 }}>
                    {Number(whTotals[it.key] || 0).toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 6,
            padding: 6,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 11 }}>
            In production buildings
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 6,
            }}
          >
            {[
              { key: "wood", label: "Wood", icon: "🪵" },
              { key: "wheat", label: "Wheat", icon: "🌾" },
              { key: "stone", label: "Stone", icon: "🪨" },
              { key: "fish", label: "Fish", icon: "🐟" },
            ].map((it) => (
              <div
                key={it.key}
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  background: "#111",
                  border: "1px solid #333",
                  borderRadius: 4,
                  padding: 4,
                }}
              >
                <div style={{ fontSize: 16, width: 20, textAlign: "center" }}>
                  {it.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 10 }}>
                    {it.label}
                  </div>
                  <div style={{ opacity: 0.85, fontSize: 9 }}>
                    {Number(productionTotals[it.key] || 0).toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelContainer>
  );
}

function collectWarehouses() {
  const grid = GameModel.gridData || [];
  const list = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < (row?.length || 0); x++) {
      const c = row[x];
      if (c?.buildingType === BUILDING_TYPES.WAREHOUSE && c.root === c)
        list.push(c);
    }
  }
  return list;
}

function sumWarehouseResources(wares) {
  const sum = { wood: 0, stone: 0, wheat: 0, fish: 0 };
  wares.forEach((w) => {
    const s = w.data?.storage || {};
    sum.wood += s.wood || 0;
    sum.stone += s.stone || 0;
    sum.wheat += s.wheat || 0;
    sum.fish += s.fish || 0;
  });
  return sum;
}

function collectProductionBuildingResources() {
  const grid = GameModel.gridData || [];
  const sum = { wood: 0, stone: 0, wheat: 0, fish: 0 };

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      if (!cell || !cell.root || cell.root !== cell) continue;

      // Check each production building type
      if (cell.buildingType === BUILDING_TYPES.LUMBERYARD) {
        sum.wood += cell.data?.availableToDeliver || 0;
      } else if (cell.buildingType === BUILDING_TYPES.QUARRY) {
        sum.stone += cell.data?.availableToDeliver || 0;
      } else if (cell.buildingType === BUILDING_TYPES.FARM) {
        sum.wheat += cell.data?.availableToDeliver || 0;
      } else if (cell.buildingType === BUILDING_TYPES.FISHERMAN_HUT) {
        sum.fish += cell.data?.availableToDeliver || 0;
      }
    }
  }

  return sum;
}

function AdminPanel({
  adminMode,
  setAdminMode,
  adminTileType,
  setAdminTileType,
}) {
  const scene = window.__phaserScene;

  useEffect(() => {
    if (scene) {
      Grid.setTileOverlayVisible(scene, adminMode);
      window.__adminMode = adminMode;
    }
  }, [adminMode, scene]);

  const startAssign = () => {
    setAdminMode(true);
  };

  const selectType = (t) => {
    setAdminTileType(t);
    window.__adminTileType = t;
  };

  const onSave = async () => {
    try {
      const grid = GameModel.gridData || [];
      const tyles = grid.map((row) => row.map((c) => c.tileType));
      const { error } = await saveTilesToSupabase(tyles);
      if (error) {
        alert(`Save failed: ${error.message || String(error)}`);
      } else {
        alert("Saved tiles to Supabase.");
      }
    } catch (err) {
      alert(`Save failed: ${err?.message || String(err)}`);
    }
  };

  const launchAttack = () => {
    EventBus.emit("td-launch-attack");
  };

  const btn = {
    padding: "4px 6px",
    borderRadius: 4,
    background: "#2e7d32",
    border: "1px solid #3fa143",
    color: "#fff",
    cursor: "pointer",
    fontSize: 10,
    minWidth: 70,
  };

  const typeBtn = (t, label, color) => (
    <button
      key={t}
      onClick={() => selectType(t)}
      style={{
        padding: "4px 6px",
        borderRadius: 4,
        background: adminTileType === t ? "#1565c0" : "#222",
        border: adminTileType === t ? "1px solid #1976d2" : "1px solid #555",
        color: label === "Plains" ? "#ddd" : "#fff",
        cursor: "pointer",
        minWidth: 70,
        fontSize: 10,
      }}
      title={`Set assignment to ${label}`}
    >
      {label}
    </button>
  );

  return (
    <PanelContainer title="Admin Mode">
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button style={btn} onClick={startAssign}>
            Assign tile
          </button>
          <button style={btn} onClick={onSave}>
            Save
          </button>
          <button style={btn} onClick={launchAttack}>
            Launch attack
          </button>
          <button
            style={btn}
            onClick={() => {
              if (window.__questSystem) {
                window.__questSystem.triggerQuest("first_warehouse_delivery");
              }
            }}
          >
            Test Quest
          </button>
        </div>
        <div style={{ opacity: 0.9, fontSize: 10 }}>
          {adminMode
            ? "Click on the map to set tiles. SHIFT shows overlay."
            : ""}
        </div>
        {adminMode && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {typeBtn(TILE_TYPES.PLAINS, "Plains")}
            {typeBtn(TILE_TYPES.FOREST, "Forest")}
            {typeBtn(TILE_TYPES.WATER, "Water")}
            {typeBtn(TILE_TYPES.MOUNTAIN, "Mountain")}
          </div>
        )}
      </div>
    </PanelContainer>
  );
}
