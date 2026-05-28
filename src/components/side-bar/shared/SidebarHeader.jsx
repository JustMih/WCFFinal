import React from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import "./wcfSidebar.css";

export default function SidebarHeader({
  logo,
  title = "Contact Center",
  subtitle = "WCF",
  isOpen = true,
  onToggle,
}) {
  return (
    <div className="wcf-sidebar-header">
      <div className="wcf-sidebar-logo-wrap">
        <img src={logo} alt="WCF" className="wcf-sidebar-logo" />
      </div>
      <div className="wcf-sidebar-brand">
        <div className="wcf-sidebar-brand-title">{title}</div>
        {subtitle && <div className="wcf-sidebar-brand-sub">{subtitle}</div>}
      </div>
      {onToggle && (
        <button
          type="button"
          className="wcf-sidebar-toggle"
          onClick={onToggle}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <HiChevronLeft /> : <HiChevronRight />}
        </button>
      )}
    </div>
  );
}
