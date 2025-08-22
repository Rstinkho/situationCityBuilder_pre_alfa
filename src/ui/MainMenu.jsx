import React, { useState } from "react";

export default function MainMenu({ onStartGame }) {
  const [showInstructions, setShowInstructions] = useState(false);

  const menuStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    fontFamily: "sans-serif",
    color: "#fff"
  };

  const titleStyle = {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
    textShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
    background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  };

  const subtitleStyle = {
    fontSize: "18px",
    marginBottom: "40px",
    opacity: 0.8,
    textAlign: "center"
  };

  const buttonContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    alignItems: "center"
  };

  const buttonStyle = {
    padding: "16px 32px",
    fontSize: "18px",
    fontWeight: "600",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    minWidth: "200px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
  };

  const startButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #4caf50, #45a049)",
    color: "white"
  };

  const instructionsButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #2196f3, #1976d2)",
    color: "white"
  };

  const backButtonStyle = {
    ...buttonStyle,
    background: "linear-gradient(135deg, #ff9800, #f57c00)",
    color: "white"
  };

  const instructionsStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2100,
    padding: "20px"
  };

  const instructionsContentStyle = {
    background: "linear-gradient(135deg, #2c3e50, #34495e)",
    border: "2px solid #3498db",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "800px",
    maxHeight: "80vh",
    overflow: "auto",
    color: "#ecf0f1"
  };

  const instructionsTitleStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "24px",
    color: "#3498db",
    textAlign: "center"
  };

  const sectionStyle = {
    marginBottom: "20px"
  };

  const sectionTitleStyle = {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#f39c12"
  };

  const textStyle = {
    fontSize: "16px",
    lineHeight: "1.6",
    marginBottom: "8px"
  };

  const listStyle = {
    marginLeft: "20px",
    marginBottom: "8px"
  };

  const listItemStyle = {
    marginBottom: "4px"
  };

  if (showInstructions) {
    return (
      <div style={instructionsStyle}>
        <div style={instructionsContentStyle}>
          <h2 style={instructionsTitleStyle}>🎮 Pre-Alpha Test Instructions</h2>
          
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>🏗️ City Building System</h3>
            <p style={textStyle}>
              Build and manage your settlement with various buildings:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>🏠 <strong>House:</strong> Provides population and workers</li>
              <li style={listItemStyle}>🎓 <strong>Training Center:</strong> Trains specialized workers</li>
              <li style={listItemStyle}>🌾 <strong>Farm:</strong> Produces wheat</li>
              <li style={listItemStyle}>🪵 <strong>Lumberyard:</strong> Produces wood</li>
              <li style={listItemStyle}>⛏️ <strong>Quarry:</strong> Produces stone</li>
              <li style={listItemStyle}>🎣 <strong>Fisherman Hut:</strong> Produces fish</li>
              <li style={listItemStyle}>🏗️ <strong>Warehouse:</strong> Stores resources</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>🛡️ Tower Defense System</h3>
            <p style={textStyle}>
              Defend your settlement from enemy attacks:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>🏹 <strong>Tower:</strong> 2-tile high defensive structure</li>
              <li style={listItemStyle}>🎯 <strong>Auto-targeting:</strong> Towers automatically attack nearest enemies</li>
              <li style={listItemStyle}>⚔️ <strong>Enemy waves:</strong> Enemies spawn from the right side</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>📖 Quest Events System</h3>
            <p style={textStyle}>
              Experience dynamic story events that affect gameplay:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>💰 <strong>Tribute System:</strong> Pay gold to avoid attacks</li>
              <li style={listItemStyle}>⚡ <strong>Attack Cycle:</strong> Rejecting tribute triggers enemy waves</li>
              <li style={listItemStyle}>⏰ <strong>Timing:</strong> 30-second warning before attacks begin</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>🎯 Game Objectives</h3>
            <p style={textStyle}>
              <strong>🏆 WIN CONDITION:</strong> Fill at least 2 warehouses completely with resources to achieve victory!
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Build a thriving settlement</li>
              <li style={listItemStyle}>Manage resources and population</li>
              <li style={listItemStyle}>Defend against enemy attacks</li>
              <li style={listItemStyle}>Make strategic decisions in quest events</li>
              <li style={listItemStyle}>🏗️ <strong>Fill 2 warehouses completely to win!</strong></li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>⚔️ Lose Conditions</h3>
            <ul style={listStyle}>
              <li style={listItemStyle}>💰 <strong>Gold below 0:</strong> Enemy breaches steal 5 gold each</li>
              <li style={listItemStyle}>🛡️ <strong>Poor defense:</strong> Let too many enemies through</li>
              <li style={listItemStyle}>📈 <strong>Bad decisions:</strong> Rejecting tribute without proper defenses</li>
            </ul>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>⚠️ Important Notes</h3>
            <ul style={listStyle}>
              <li style={listItemStyle}>This is a pre-alpha test version</li>
              <li style={listItemStyle}>Some features may be incomplete</li>
              <li style={listItemStyle}>Report bugs and feedback</li>
              <li style={listItemStyle}>Game saves automatically</li>
            </ul>
          </div>

          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <button
              onClick={() => setShowInstructions(false)}
              style={backButtonStyle}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
              }}
            >
              ← Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={menuStyle}>
      <h1 style={titleStyle}>SITUATION 0.01</h1>
      <p style={subtitleStyle}>Pre-Alpha Test Version</p>
      
      <div style={buttonContainerStyle}>
        <button
          onClick={onStartGame}
          style={startButtonStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
          }}
        >
          🚀 Start Game
        </button>
        
        <button
          onClick={() => setShowInstructions(true)}
          style={instructionsButtonStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
          }}
        >
          📖 Instructions
        </button>
      </div>
      
      <div style={{ 
        position: "absolute", 
        bottom: "20px", 
        fontSize: "14px", 
        opacity: 0.6,
        textAlign: "center"
      }}>
        <p>Pre-Alpha Test Build</p>
        <p>Not all features are final</p>
      </div>
    </div>
  );
}
