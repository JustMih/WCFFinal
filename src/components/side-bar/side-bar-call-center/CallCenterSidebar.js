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
import "./callCenterSidebar.css";
export default function CallCenterSidebar({ isSidebarOpen, role }) {
  return (
    <aside
      className={`call-center-sidebar ${isSidebarOpen ? "open" : "closed"}`}
    >
      {isSidebarOpen && (
        <img src={logo} alt="Avatar" className="sidebar-logo" />
      )}
      <ul>
        <li>
          {(role === "admin" || role === "super-admin") && (
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
                    <span className="menu-text">Admin Dashboard</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/extension"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <TiFlowSwitch className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Extension</span>
                  )}
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
              <NavLink
                to="/ivr"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <GiVrHeadset className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">IVR's</span>}
                </div>
              </NavLink>
              <NavLink
                to="/ivr-voices"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineAudiotrack className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">IVR's Voices</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/ivr-action"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <TbActivityHeartbeat className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">IVR's Actions</span>
                  )}
                </div>
              </NavLink>
              <NavLink
              to="/ivr-dtmf-mappings"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
               <div className="menu-item">
                  <TbActivityHeartbeat className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">IVR's Mapping</span>
                  )}
                </div>
            </NavLink>
            <NavLink
                to="/recorded-sounds"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineAudiotrack className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Recorded Sounds</span>}
                </div>
              </NavLink>
              <NavLink
                to="/ivr-holidays"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineAudiotrack className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">IVR Holdays</span>}
                </div>
              </NavLink>
            
              <NavLink
                to="/ivr-emegency"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineAudiotrack className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">IVR Emegency Number</span>}
                </div>
              </NavLink>
              <NavLink
                  to="/voice-notes"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <MdOutlineAudiotrack className="menu-icon" />
                    {isSidebarOpen && <span className="menu-text">Voice Notes Reports</span>}
                  </div>
                </NavLink>

              <NavLink
                to="/cdr-reports"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineAudiotrack className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">CDR Reports</span>}
                
                </div>
                                
               
              </NavLink>
              <NavLink
                to="/ivr-interactions"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineAudiotrack className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">IVR interactions Reports</span>}
                
                </div>
                                
               
              </NavLink>
            </>
            
          )}
          {role === "agent" && (
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
                    <span className="menu-text">Agent Dashboard</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/agent-chat"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <BsChatRightTextFill className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Supervisor Chat</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                  to="/voice-notes"
                  className={({ isActive }) =>
                    isActive ? "menu-item active-link" : "menu-item"
                  }
                >
                  <div className="menu-item">
                    <MdOutlineAudiotrack className="menu-icon" />
                    {isSidebarOpen && <span className="menu-text">Voice Notes Reports</span>}
                  </div>
                </NavLink>
            </>
          )}
          {role === "supervisor" && (
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
                    <span className="menu-text">Supervisor Dashboard</span>
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
                to="/agents-logs"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <TbLogs className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Agents Logs</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/supervisor-chat"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <BsChatRightTextFill className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Agents Chat</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/social-message"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <BsChatRightTextFill className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Social Notifications</span>
                  )}
                </div>
              </NavLink>
            </>
          )}
        </li>
      </ul>
    </aside>
  );
}
