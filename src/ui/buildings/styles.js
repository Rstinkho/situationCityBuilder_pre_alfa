export const panelStyle = {
  position: "absolute",
  left: 12,
  bottom: 12,
  minWidth: 320,
  background: "rgba(20,20,20,0.95)",
  color: "#fff",
  padding: 16,
  borderRadius: 10,
  fontFamily: "sans-serif",
  fontSize: 14,
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  border: "1px solid #333",
};

export const btnStyle = {
  display: "block",
  width: "100%",
  padding: "8px 10px",
  margin: "6px 0",
  borderRadius: 6,
  border: "1px solid #666",
  background: "#2a2a2a",
  color: "#fff",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

export const btnDestroy = {
  ...btnStyle,
  width: "auto",
  padding: "6px 8px",
  margin: 0,
  background: "#7a1f1f",
  border: "1px solid #a33",
};

// New minimalistic button styles
export const btnMinimal = {
  ...btnStyle,
  padding: "8px 12px",
  margin: "4px 0",
  background: "#2e7d32",
  border: "1px solid #4caf50",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  transition: "all 0.2s ease",
};

export const btnMinimalSecondary = {
  ...btnMinimal,
  background: "#424242",
  border: "1px solid #666",
};

export const btnMinimalSmall = {
  ...btnMinimal,
  padding: "6px 10px",
  fontSize: 11,
  margin: "2px 0",
};

export const btnMinimalIcon = {
  ...btnMinimal,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 10px",
};

export const btnMinimalDisabled = {
  ...btnMinimal,
  background: "#1a1a1a",
  border: "1px solid #444",
  color: "#666",
  cursor: "default",
};

