import React from "react";

export default function GameWon({ onReturnToMenu }) {
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
    background: "linear-gradient(135deg, #2e7d32, #4caf50)",
    border: "3px solid #66bb6a",
    borderRadius: "20px",
    padding: "40px",
    maxWidth: "500px",
    textAlign: "center",
    color: "#fff",
    boxShadow: "0 8px 32px rgba(46, 125, 50, 0.6)"
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

  const achievementStyle = {
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
    background: "linear-gradient(135deg, #43a047, #388e3c)",
    color: "white",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    minWidth: "200px"
  };

  return (
    <div style={overlayStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>🏆 VICTORY!</h1>
        
        <p style={messageStyle}>
          Congratulations! You have successfully built a thriving settlement 
          and achieved the ultimate goal of prosperity.
        </p>
        
        <div style={achievementStyle}>
          🏗️ Achievement Unlocked:<br />
          "Master Builder"<br />
          <small>Fill 2 warehouses completely</small>
        </div>
        
        <p style={messageStyle}>
          Your strategic planning and resource management have paid off! 
          You've proven yourself as a capable leader who can build and defend 
          a successful settlement.
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
