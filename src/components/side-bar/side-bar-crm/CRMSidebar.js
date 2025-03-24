import React from 'react'
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { MdOutlineSupportAgent } from "react-icons/md";
import logo from "../../../asserts/images/logo.png";
import "./crmSidebar.css";

export default function CRMSidebar({ isSidebarOpen }) {
  return (
    <aside className={`crm-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      {isSidebarOpen && (
        <img src={logo} alt="Avatar" className="crm-sidebar-logo" />
      )}
      <ul>
        <li>
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "menu-item active-link" : "menu-item"
              }
            >
              <div className="menu-item">
                <RxDashboard className="menu-icon" />
                {isSidebarOpen && (
                  <span className="menu-text">CRM Dashboard</span>
                )}
              </div>
            </NavLink>
            {/* <NavLink
              to="/agents"
              className={({ isActive }) =>
                isActive ? "menu-item active-link" : "menu-item"
              }
            >
              <div className="menu-item">
                <MdOutlineSupportAgent className="menu-icon" />
                {isSidebarOpen && <span className="menu-text">Agents</span>}
              </div>
            </NavLink> */}
          </>
        </li>
      </ul>
    </aside>
  );
}
