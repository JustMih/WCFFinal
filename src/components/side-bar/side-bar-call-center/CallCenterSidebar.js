import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { MdOutlineSupportAgent, MdOutlineAudiotrack } from "react-icons/md";
import { TbActivityHeartbeat, TbLogs } from "react-icons/tb";
import {
  FaRegUser,
  FaInstagram,
  FaFacebook,
  FaWhatsapp
} from "react-icons/fa6";
import { TiFlowSwitch } from "react-icons/ti";
import { GiVrHeadset } from "react-icons/gi";
import { BsChatRightTextFill } from "react-icons/bs";
import logo from "../../../asserts/images/logo.png";
import "./callCenterSidebar.css";
import {
  Collapse,
  List,
  ListItemButton,
  Badge
} from "@mui/material";

export default function CallCenterSidebar({ isSidebarOpen, role, instagramUnreadCount = 0 }) {
  const [openSocial, setOpenSocial] = useState(false);
  const toggleSocialMenu = () => setOpenSocial((prev) => !prev);

  return (
    <aside className={`call-center-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      {isSidebarOpen && (
        <img src={logo} alt="Avatar" className="sidebar-logo" />
      )}

      <ul>
        <li>
          {/* Supervisor Section Only for Simplicity */}
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

              {/* Social Notifications Toggle */}
              <ListItemButton 
                onClick={toggleSocialMenu}
                className={openSocial ? "active-link" : "menu-item"}
                sx={{ padding: 0 }}
              >
                <div className="menu-item">
                  <BsChatRightTextFill className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Social Notifications</span>
                  )}
                </div>
              </ListItemButton>

              {/* Dropdown */}
              <Collapse in={openSocial} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ marginLeft: '1rem' }}>
                  <NavLink
                    to="/social-message"
                    className={({ isActive }) =>
                      isActive ? "menu-item active-link" : "menu-item"
                    }
                  >
                    <div className="menu-item">
                      <Badge
                        badgeContent={instagramUnreadCount}
                        color="error"
                        sx={{ marginRight: 1 }}
                      >
                        <FaInstagram className="menu-icon" color="#E1306C" />
                      </Badge>
                      {isSidebarOpen && <span className="menu-text">Instagram</span>}
                    </div>
                  </NavLink>

                  <NavLink
                    to="/social-message/facebook"
                    className={({ isActive }) =>
                      isActive ? "menu-item active-link" : "menu-item"
                    }
                  >
                    <div className="menu-item">
                      <FaFacebook className="menu-icon" color="#1877F3" />
                      {isSidebarOpen && <span className="menu-text">Facebook</span>}
                    </div>
                  </NavLink>

                  <NavLink
                    to="/social-message/whatsapp"
                    className={({ isActive }) =>
                      isActive ? "menu-item active-link" : "menu-item"
                    }
                  >
                    <div className="menu-item">
                      <FaWhatsapp className="menu-icon" color="#25D366" />
                      {isSidebarOpen && <span className="menu-text">WhatsApp</span>}
                    </div>
                  </NavLink>
                </List>
              </Collapse>
            </>
          )}
        </li>
      </ul>
    </aside>
  );
}
