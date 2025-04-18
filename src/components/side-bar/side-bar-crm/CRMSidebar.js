import React from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { MdOutlineSupportAgent, MdOutlineAudiotrack } from "react-icons/md";
import { TbActivityHeartbeat, TbLogs } from "react-icons/tb";
import { FaRegUser } from "react-icons/fa6";
import { TiFlowSwitch } from "react-icons/ti";
import { GiVrHeadset } from "react-icons/gi";
import { BsChatRightTextFill } from "react-icons/bs";
import logo from "../../../asserts/images/logo.png";
import "./crmSidebar.css";

export default function CRMSidebar({ isSidebarOpen, role }) {
  return (
    <aside
      className={`call-center-sidebar ${isSidebarOpen ? "open" : "closed"}`}
    >
      {isSidebarOpen && (
        <img src={logo} alt="Avatar" className="sidebar-logo" />
      )}
      <ul>
        <li>
          {role === "agent" && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineSupportAgent className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Agents Dashboard</span>
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
          )}
          {role === "coordinator" && (
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
                    <span className="menu-text">Coordinator Dashboard</span>
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
            </>
          )}
        </li>
      </ul>
    </aside>
  );
}
