import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import {
  MdOutlineSupportAgent,
  MdOutlineAudiotrack,
  MdPublic,
  MdOutlineChat,
  MdOutlineNotifications,
} from "react-icons/md";
import { TbActivityHeartbeat, TbLogs } from "react-icons/tb";
import {
  FaRegUser,
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaTelegram,
  FaComments,
} from "react-icons/fa6";
import { TiFlowSwitch } from "react-icons/ti";
import { GiVrHeadset } from "react-icons/gi";
import { BsChatRightTextFill } from "react-icons/bs";
import { HiOutlineMap } from "react-icons/hi2";
import "./callCenterSidebar.css";
import SidebarHeader from "../shared/SidebarHeader";
import logo from "../../../asserts/images/logo.png";
import { baseURL } from "../../../config";
import { Collapse, List, ListItemButton, Badge } from "@mui/material";
import ReportsSidebarMenu from "./ReportsSidebarMenu";

export default function CallCenterSidebar({
  isSidebarOpen,
  onToggleSidebar,
  role,
  instagramUnreadCount = 0,
}) {
  const [openSocial, setOpenSocial] = useState(false);
  const [openInstagram, setOpenInstagram] = useState(false);
  const toggleSocialMenu = () => setOpenSocial((prev) => !prev);
  const toggleInstagramMenu = () => setOpenInstagram((prev) => !prev);

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
      className={`wcf-sidebar call-center-sidebar ${isSidebarOpen ? "open" : "closed"}`}
    >
      <SidebarHeader
        logo={logo}
        title="Contact Center"
        subtitle="WCF"
        isOpen={isSidebarOpen}
        onToggle={onToggleSidebar}
      />
      <nav className="wcf-sidebar-nav">
      <ul>
        <li>
          {(role === "admin" || role === "super-admin") && (
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Admin Dashboard</span>
                  )}
                </span>
              </NavLink>
              <NavLink
                to="/public-dashboard"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <MdPublic className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Live Dashboard</span>
                  )}
                </span>
              </NavLink>
              <NavLink
                to="/extension"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <TiFlowSwitch className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Extension</span>
                  )}
                </span>
              </NavLink>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <FaRegUser className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Users</span>}
                </span>
              </NavLink>
              {/* Lookup Tables Management - Super Admin Only */}
              {/* <NavLink
                to="/lookup-tables"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <FaRegUser className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Lookup Tables</span>
                  )}
                </span>
              </NavLink> */}
              {/* Mapping Management - Super Admin Only */}
              {role === "super-admin" && (
                <>
                  <NavLink
                    to="/mapping"
                    className={({ isActive }) =>
                      isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                    }
                  >
                    <span className="sidebar-nav-row">
                      <HiOutlineMap className="menu-icon" />
                      {isSidebarOpen && (
                        <span className="menu-text">Mapping</span>
                      )}
                    </span>
                  </NavLink>
                  {/* <NavLink
                    to="/system-logs"
                    className={({ isActive }) =>
                      isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                    }
                  >
                    <span className="sidebar-nav-row">
                      <TbLogs className="menu-icon" />
                      {isSidebarOpen && (
                        <span className="menu-text">System Logs</span>
                      )}
                    </span>
                  </NavLink> */}
                </>
              )}
              {/*IVR management */}
              <NavLink
                to="/ivr-cards"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <GiVrHeadset className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">IVR Management</span>
                  )}
                </span>
              </NavLink>
            </>
          )}
          {role === "agent" && (
            <>
              <NavLink
                to="/dashboard-old"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Agent Dashboard</span>
                  )}
                </span>
              </NavLink>
              <NavLink
                to="/public-dashboard"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <MdPublic className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Live Dashboard</span>
                  )}
                </span>
              </NavLink>
              <NavLink
                to="/agent-chat"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
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
                </span>
              </NavLink>
              <NavLink
                to="/voice-notes"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <MdOutlineAudiotrack className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Voice Notes Reports</span>
                  )}
                </span>
              </NavLink>
              <ReportsSidebarMenu isSidebarOpen={isSidebarOpen} />
            </>
          )}
          {(role === "supervisor" || role === "director-general") && (
            <>
              <NavLink
                to="/dashboard-old"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">
                      {role === "director-general"
                        ? "Dashboard"
                        : "Supervisor Dashboard"}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink
                to="/dashboard2"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">
                      {role === "director-general"
                        ? "Dashboard"
                        : "Supervisor Dashboard Two"}
                    </span>
                  )}
                </span>
              </NavLink>

              <NavLink
                to="/public-dashboard"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <MdPublic className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Public Dashboard</span>
                  )}
                </span>
              </NavLink>

                <NavLink
                to="/ivr-cards"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <GiVrHeadset className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">IVR Management</span>
                  )}
                </span>
              </NavLink>
        
              
              <NavLink
                to="/agents"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <MdOutlineSupportAgent className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Agents</span>}
                </span>
              </NavLink>

              {/* <NavLink
                to="/agents-logs"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <TbLogs className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Agents Logs</span>
                  )}
                </span>
              </NavLink> */}

              <NavLink
                to="/supervisor-chat"
                className={({ isActive }) =>
                  isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                }
              >
                <span className="sidebar-nav-row">
                  <MdOutlineChat className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Agents Chat</span>
                  )}
                  {!loading && unreadMessagesCount > 0 && (
                    <Badge
                      badgeContent={unreadMessagesCount}
                      color="error"
                      sx={{ marginLeft: 1 }}
                    />
                  )}
                </span>
              </NavLink>

              {/* Social Notifications Toggle - same link style as other items */}
              <div
                onClick={toggleSocialMenu}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleSocialMenu();
                  }
                }}
                className={`sidebar-nav-link sidebar-nav-toggle ${openSocial ? "active-link" : ""}`}
                style={{ cursor: "pointer" }}
              >
                <span className="sidebar-nav-row">
                  <MdOutlineNotifications className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Social Notifications</span>
                  )}
                </span>
              </div>

              {/* Dropdown - directly under Social Notifications toggle */}
              <Collapse in={openSocial} timeout={200} unmountOnExit>
                <List
                  component="div"
                  disablePadding
                  className="social-notifications-dropdown"
                  sx={{ marginLeft: 0, paddingLeft: 0 }}
                >
                  {/* Instagram Toggle */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleInstagramMenu();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleInstagramMenu();
                      }
                    }}
                    className={`sidebar-nav-link sidebar-nav-toggle ${openInstagram ? "active-link" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="sidebar-nav-row sidebar-nav-row--nested">
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
                    </span>
                  </div>

                  {/* Instagram Sub-menu */}
                  <Collapse in={openInstagram} timeout={200} unmountOnExit>
                    <List
                      component="div"
                      disablePadding
                      className="instagram-sub-menu"
                      sx={{ marginLeft: "2.5rem", paddingLeft: 0 }}
                    >
                      <NavLink
                        to="/social-message?tab=dashboard"
                        className={({ isActive }) =>
                          isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                        }
                      >
                        <span className="sidebar-nav-row">
                          <RxDashboard className="menu-icon" color="#667eea" />
                          {isSidebarOpen && (
                            <span className="menu-text">Dashboard</span>
                          )}
                        </span>
                      </NavLink>

                      <NavLink
                        to="/social-message?tab=message"
                        className={({ isActive }) =>
                          isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                        }
                      >
                        <span className="sidebar-nav-row">
                          <FaTelegram className="menu-icon" color="#667eea" />
                          {isSidebarOpen && (
                            <span className="menu-text">Messages</span>
                          )}
                        </span>
                      </NavLink>

                      <NavLink
                        to="/social-message?tab=comment"
                        className={({ isActive }) =>
                          isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                        }
                      >
                        <span className="sidebar-nav-row">
                          <FaComments className="menu-icon" color="#667eea" />
                          {isSidebarOpen && (
                            <span className="menu-text">Comments</span>
                          )}
                          {instagramUnreadCount > 0 && (
                            <Badge
                              badgeContent={instagramUnreadCount}
                              color="error"
                              sx={{ marginLeft: 1 }}
                            />
                          )}
                        </span>
                      </NavLink>
                    </List>
                  </Collapse>

                  <NavLink
                    to="/social-message/facebook"
                    className={({ isActive }) =>
                      isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                    }
                    style={{ paddingLeft: "2rem" }}
                  >
                    <span className="sidebar-nav-row">
                      <FaFacebook className="menu-icon" color="#1877F3" />
                      {isSidebarOpen && (
                        <span className="menu-text">Facebook</span>
                      )}
                    </span>
                  </NavLink>

                  <NavLink
                    to="/social-message/whatsapp"
                    className={({ isActive }) =>
                      isActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"
                    }
                    style={{ paddingLeft: "2rem" }}
                  >
                    <span className="sidebar-nav-row">
                      <FaWhatsapp className="menu-icon" color="#25D366" />
                      {isSidebarOpen && (
                        <span className="menu-text">WhatsApp</span>
                      )}
                    </span>
                  </NavLink>
                </List>
              </Collapse>

              <ReportsSidebarMenu isSidebarOpen={isSidebarOpen} />
            </>
          )}
          {(role === "admin" || role === "super-admin") && (
            <ReportsSidebarMenu isSidebarOpen={isSidebarOpen} />
          )}
        </li>
      </ul>
      </nav>
    </aside>
  );
}
