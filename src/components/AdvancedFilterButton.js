import React from "react";
import { FiSettings } from "react-icons/fi";

export default function AdvancedFilterButton({ onClick, style = {}, ...props }) {
  return (
    <button
      className="advanced-filter-btn"
      title="Advanced Filter"
      style={{
        background: "#f5f5f5",
        border: "none",
        borderRadius: "4px",
        padding: "6px 10px",
        cursor: "pointer",
        color: "#1976d2",
        marginLeft: 8,
        ...style
      }}
      onClick={onClick}
      {...props}
    >
      <FiSettings />
      <span style={{ marginLeft: 6 }}>Advanced</span>
    </button>
  );
} 