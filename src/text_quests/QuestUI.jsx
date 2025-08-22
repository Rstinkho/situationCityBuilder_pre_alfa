import React, { useState, useEffect } from "react";

export default function QuestUI() {
  const [currentQuest, setCurrentQuest] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Make this component globally accessible
    window.__questUI = {
      showQuest: (quest) => {
        setCurrentQuest(quest);
        setIsVisible(true);
        setMessage("");
      },
      hideQuest: () => {
        setIsVisible(false);
        setCurrentQuest(null);
        setMessage("");
      }
    };

    return () => {
      delete window.__questUI;
    };
  }, []);

  const handleChoice = (choice) => {
    if (choice.action && window.__questModel) {
      const result = choice.action(window.__questModel);
      
      if (result) {
        setMessage(result.message);
        
        // Hide quest after a delay if it was successful
        if (result.success) {
          setTimeout(() => {
            setIsVisible(false);
            setCurrentQuest(null);
            setMessage("");
          }, 3000);
        }
      }
    }
  };

  if (!isVisible || !currentQuest) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: "sans-serif"
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #2c3e50, #34495e)",
          border: "2px solid #3498db",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          color: "#ecf0f1",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)"
        }}
      >
        {/* Quest Title */}
        <h2
          style={{
            margin: "0 0 16px 0",
            fontSize: "24px",
            fontWeight: "bold",
            color: "#3498db",
            textAlign: "center",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
          }}
        >
          {currentQuest.title}
        </h2>

        {/* Quest Description */}
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "16px",
            lineHeight: "1.5",
            textAlign: "center",
            color: "#bdc3c7"
          }}
        >
          {currentQuest.description}
        </p>

        {/* Message Display */}
        {message && (
          <div
            style={{
              background: "rgba(52, 152, 219, 0.2)",
              border: "1px solid #3498db",
              borderRadius: "8px",
              padding: "12px",
              margin: "0 0 20px 0",
              textAlign: "center",
              fontSize: "14px",
              color: "#3498db"
            }}
          >
            {message}
          </div>
        )}

        {/* Choice Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >
          {currentQuest.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleChoice(choice)}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: index === 0 
                  ? "linear-gradient(135deg, #27ae60, #2ecc71)"
                  : "linear-gradient(135deg, #e74c3c, #c0392b)",
                color: "white",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                minWidth: "140px"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setCurrentQuest(null);
            setMessage("");
          }}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(231, 76, 60, 0.8)",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(231, 76, 60, 1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(231, 76, 60, 0.8)";
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
