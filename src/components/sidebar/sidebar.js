import React from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaRegUser } from "react-icons/fa6";
import { IoKeypadOutline } from "react-icons/io5";
import { TiFlowSwitch } from "react-icons/ti";
// import { MdOutlineSupportAgent } from "react-icons/md";
import { BiSolidVideoRecording } from "react-icons/bi";
import { MdOutlineSupportAgent, MdEmail } from "react-icons/md";
import logo from "../../image/wcf_logo.png";
import "./sidebar.css";

const Sidebar = ({ isSidebarOpen }) => {
  const role = localStorage.getItem("role");
  return (
    <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      {isSidebarOpen && <img src={logo} alt="Avatar" className="logo" />}
      <ul>
        <li>
          {role === "super-admin" && (
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
                    <span className="menu-text">Dashboard</span>
                  )}
                </div>
              </NavLink>
              {/* <NavLink
                to="/did"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <IoKeypadOutline className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Dids</span>}
                </div>
              </NavLink> */}
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
              {/* <NavLink
                to="/call"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineSupportAgent className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Call Test</span>}
                </div>
              </NavLink> */}
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
                to="/crm"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <BiSolidVideoRecording className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">CRM</span>}
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
          )}
          {role === "admin" && (
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
                    <span className="menu-text">Dashboard</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/did"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <IoKeypadOutline className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Dids</span>}
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
                to="/crm"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineSupportAgent className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">CRM</span>}
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
          )}
          {role === "supervisor" && (
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
                    <span className="menu-text">Dashboard</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/did"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <IoKeypadOutline className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Dids</span>}
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
                to="/crm"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineSupportAgent className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">CRM</span>}
                </div>
              </NavLink>
            </>
          )}
          {role === "agent" && (
            <>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Home</span>}
                </div>
              </NavLink>
              <NavLink
                to="/message"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdEmail className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Message</span>}
                </div>
              </NavLink><NavLink
                to="/crm"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdOutlineSupportAgent className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">CRM</span>}
                </div>
              </NavLink>
            </>
          )}
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
