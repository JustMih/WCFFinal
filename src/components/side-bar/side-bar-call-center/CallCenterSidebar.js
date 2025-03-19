import React from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { MdOutlineSupportAgent } from "react-icons/md";
import { FaRegUser } from "react-icons/fa6";
import logo from "../../../asserts/images/logo.png";
import "./callCenterSidebar.css";

export default function CallCenterSidebar({ isSidebarOpen }) {
  return (
    <aside
      className={`call-center-sidebar ${isSidebarOpen ? "open" : "closed"}`}
    >
      {isSidebarOpen && (
        <img src={logo} alt="Avatar" className="sidebar-logo" />
      )}
      <ul>
        <li>
          <>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "menu-item active-link" : "menu-item"
              }
            >
              <div className="menu-item">
                <RxDashboard className="menu-icon" />
                {isSidebarOpen && (
                  <span className="menu-text">Call Center Dashboard</span>
                )}
              </div>
            </NavLink>
            <NavLink
              to="/agents"
              className={({ isActive }) =>
                isActive ? "menu-item active-link" : "menu-item"
              }
            >
              <div className="menu-item">
                <MdOutlineSupportAgent className="menu-icon" />
                {isSidebarOpen && <span className="menu-text">Agents</span>}
              </div>
            </NavLink>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? "menu-item active-link" : "menu-item"
              }
            >
              <div className="menu-item">
                <FaRegUser className="menu-icon" />
                {isSidebarOpen && <span className="menu-text">Users</span>}
              </div>
            </NavLink>
          </>
        </li>
      </ul>
    </aside>
  );
}
