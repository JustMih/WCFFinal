import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { MdOutlineSupportAgent, MdOutlineAudiotrack } from "react-icons/md";
import { TbActivityHeartbeat, TbLogs } from "react-icons/tb";
import {
  FaRegUser,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
} from "react-icons/fa6";
import { TiFlowSwitch } from "react-icons/ti";
import { GiVrHeadset } from "react-icons/gi";
import { BsChatRightTextFill } from "react-icons/bs";
import logo from "../../../asserts/images/logo.png";
import "./callCenterSidebar.css";
import { baseURL } from "../../../config";
import { Collapse, List, ListItemButton, Badge } from "@mui/material";
export default function CallCenterSidebar({
  isSidebarOpen,
  role,
  instagramUnreadCount = 0,
}) {
  const [openSocial, setOpenSocial] = useState(false);
  const toggleSocialMenu = () => setOpenSocial((prev) => !prev);

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    // Fetch the unread messages count
    const fetchUnreadMessagesCount = async () => {
      try {
        const response = await fetch(
          `${baseURL}/users/unread-messages/${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch unread messages");
        }
        const data = await response.json();
        setUnreadMessagesCount(data.unreadCount || 0);
      } catch (error) {
        console.error("Error fetching unread messages count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadMessagesCount();
  }, [userId]);

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
              {/* <NavLink
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
                  {isSidebarOpen && <span className="menu-text">IVR Reports</span>}
                
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
              <NavLink
        to="/livestream"
        className={({ isActive }) =>
          isActive ? "menu-item active-link" : "menu-item"
        }
      >
        <div className="menu-item">
          <MdOutlineAudiotrack className="menu-icon" />
          {isSidebarOpen && <span className="menu-text">Live Streaming</span>}
        </div>
      </NavLink>
      <NavLink
  to="/recorded-audio"
  className={({ isActive }) => (isActive ? "menu-item active-link" : "menu-item")}
>
  <div className="menu-item">
    <MdOutlineAudiotrack className="menu-icon" />
    {isSidebarOpen && <span className="menu-text">Recorded Audio</span>}
  </div>
</NavLink> */}
              <NavLink
                to="/ivr-cards"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <GiVrHeadset className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">IVR Management</span>
                  )}
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
                to="/dashboard2"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Agent Dashboard2</span>
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
                  {/* Display badge if there are unread messages */}
                  {!loading && unreadMessagesCount > 0 && (
                    <Badge
                      badgeContent={unreadMessagesCount}
                      color="error"
                      sx={{ marginLeft: 1 }}
                    />
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
                  {isSidebarOpen && (
                    <span className="menu-text">Voice Notes Reports</span>
                  )}
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
                to="/dashboard2"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Supervisor Dashboard Two</span>
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

              {/* <NavLink
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
              </NavLink> */}

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
                  {/* Display badge if there are unread messages */}
                  {!loading && unreadMessagesCount > 0 && (
                    <Badge
                      badgeContent={unreadMessagesCount}
                      color="error"
                      sx={{ marginLeft: 1,}}
                    />
                  )}
                </div>
              </NavLink>

              {/* Social Notifications Toggle */}
              {/* <ListItemButton
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
              </ListItemButton> */}

              {/* Dropdown */}
              <Collapse in={openSocial} timeout="auto" unmountOnExit>
                <List
                  component="div"
                  disablePadding
                  sx={{ marginLeft: "1rem" }}
                >
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
                      {isSidebarOpen && (
                        <span className="menu-text">Instagram</span>
                      )}
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
                      {isSidebarOpen && (
                        <span className="menu-text">Facebook</span>
                      )}
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
                      {isSidebarOpen && (
                        <span className="menu-text">WhatsApp</span>
                      )}
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
