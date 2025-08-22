import React from "react";

export default function GameOver({ onReturnToMenu, finalScore }) {
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2500,
    fontFamily: "sans-serif"
  };

  const contentStyle = {
    background: "linear-gradient(135deg, #8b0000, #dc143c)",
    border: "3px solid #ff4444",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "500px",
    textAlign: "center",
    color: "#fff",
    boxShadow: "0 8px 32px rgba(139, 0, 0, 0.6)"
  };

  const titleStyle = {
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "20px",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)"
  };

  const messageStyle = {
    fontSize: "18px",
    marginBottom: "30px",
    lineHeight: "1.5",
    opacity: 0.9
  };

  const scoreStyle = {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "30px",
    padding: "16px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  };

  const buttonStyle = {
    padding: "16px 32px",
    fontSize: "18px",
    fontWeight: "600",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "linear-gradient(135deg, #ff6b6b, #ee5a52)",
    color: "white",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    minWidth: "200px"
  };

  return (
    <div style={overlayStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>💀 GAME OVER</h1>
        
        <p style={messageStyle}>
          Your settlement has fallen! The enemies have stolen all your gold, 
          leaving you with nothing to rebuild.
        </p>
        
        <div style={scoreStyle}>
          Final Gold: {finalScore}g
        </div>
        
        <p style={messageStyle}>
          Don't give up! Return to the main menu and try again with 
          better strategies and stronger defenses.
        </p>
        
        <button
          onClick={onReturnToMenu}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
          }}
        >
          🏠 Return to Main Menu
        </button>
      </div>
    </div>
  );
}
