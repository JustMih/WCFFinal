import React from "react";
import logo from "../../asserts/images/logo.png";
import "./WcfLoader.css";

export default function WcfLoader({
  size = "md",
  message,
  label = "Loading",
  className = "",
}) {
  const sizeClass =
    size === "sm" ? "wcf-loader--sm" : size === "lg" ? "wcf-loader--lg" : "wcf-loader--md";

  return (
    <div
      className={`wcf-loader ${sizeClass} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="wcf-loader__spinner-wrap">
        <span className="wcf-loader__ring loader" aria-hidden="true" />
        <img src={logo} alt="" className="wcf-loader__logo" />
      </div>
      {message && <p className="wcf-loader__message">{message}</p>}
    </div>
  );
}

export function WcfLoadingOverlay({
  message,
  label = "Loading",
  fullPage = false,
  transparent = false,
  size = "lg",
  className = "",
}) {
  return (
    <div
      className={`wcf-loading-overlay ${fullPage ? "wcf-loading-overlay--full-page" : ""} ${transparent ? "wcf-loading-overlay--transparent" : ""} ${className}`.trim()}
    >
      <WcfLoader size={size} message={message} label={label} />
    </div>
  );
}
