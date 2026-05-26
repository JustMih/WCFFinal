import React from "react";

const COLORS = {
  success: "#4caf50",
  error: "#f44336",
  warning: "#ff9800",
  info: "#2196f3",
};

const TITLES = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

/**
 * Modal overlay used for action feedback (success/error/warning/info),
 * matching the style used on ticket creation.
 */
export default function ActionMessageModal({
  open,
  type = "info",
  message = "",
  onClose,
}) {
  if (!open) return null;

  const borderColor = COLORS[type] || COLORS.info;
  const title = TITLES[type] || TITLES.info;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1301,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "8px",
          width: "400px",
          textAlign: "center",
          borderLeft: `6px solid ${borderColor}`,
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", color: borderColor }}>{title}</h3>
        <p style={{ margin: "0 0 20px 0", fontSize: "14px", lineHeight: "1.5" }}>
          {message}
        </p>
        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            background: "#007bff",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

