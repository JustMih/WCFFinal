import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import logo from "../../../asserts/images/logo.png";
import { MdOutlineSupportAgent, MdEmail } from "react-icons/md";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import { baseURL } from "../../../config";
import "./crmSidebar.css";

export default function CRMSidebar({ isSidebarOpen }) {
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    assigned: 0,
    closed: 0,
    overdue: 0,
    carriedForward: 0,
    newTickets: {
      Complaints: 0,
      "New Tickets": 0,
      "Escalated Tickets": 0
    },
    convertedTickets: {
      Inquiries: 0,
      Complaints: 0,
      Suggestions: 0,
      Complements: 0
    },
    channeledTickets: {
      Directorate: 0,
      Units: 0
    },
    ticketStatus: {
      Open: 0,
      "On Progress": 0,
      Closed: 0,
      Minor: 0,
      Major: 0
    }
  });
  const [fetchError, setFetchError] = useState(null);

  const role = localStorage.getItem("role");

  // Helper to fetch in-progress assignments count
  const fetchInProgressAssignmentsCount = async (userId, token) => {
    try {
      const url = `${baseURL}/ticket/assignments/in-progress?userId=${userId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data.count || 0;
    } catch {
      return 0;
    }
  };

  const fetchTicketCounts = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) {
      setFetchError("Missing userId or token");
      return;
    }
    try {
      // Use different endpoints based on role
      let url;
      if (role === "coordinator") {
        url = `${baseURL}/coordinator/dashboard-counts/${userId}`;
      } else if (['focal-person', 'claim-focal-person', 'compliance-focal-person'].includes(role)) {
        url = `${baseURL}/focal-person/dashboard-counts`;
      } else {
        url = `${baseURL}/ticket/dashboard-counts/${userId}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        setFetchError(`Fetch failed: ${response.status} - ${errorText}`);
        return;
      }
      const data = await response.json();
      let stats = data.ticketStats ? { ...data.ticketStats } : {};
      // Fetch in-progress assignments count and add to stats
      const inProgressAssignments = await fetchInProgressAssignmentsCount(userId, token);
      stats.inProgress = inProgressAssignments;
      setTicketStats(stats);
      setFetchError(null);
    } catch (error) {
      setFetchError(error.message);
    }
  };

  const toggleAgentsDropdown = () => {
    if (!isAgentsOpen) {
      fetchTicketCounts();
    }
    setIsAgentsOpen((prev) => !prev);
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  useEffect(() => {
    fetchTicketCounts();
  }, []);

  return (
    <aside className={`crm-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      {isSidebarOpen && (
        <img src={logo} alt="Avatar" className="crm-sidebar-logo" />
      )}
      <ul>
        {(role === "agent" || role === "attendee") && (
          <>
            <li>
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
                to="/notifications"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdEmail className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Notifications</span>
                  )}
                </div>
              </NavLink>

              <div
                className={`menu-item ${
                  window.location.pathname.startsWith("/ticket")
                    ? "active-link"
                    : ""
                }`}
                onClick={toggleAgentsDropdown}
                style={{ cursor: "pointer", padding: "12px 20px" }}
              >
                <MdOutlineSupportAgent className="menu-icon" />
                {isSidebarOpen && (
                  <span className="menu-text">
                    Ticket Management{" "}
                    {isAgentsOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                )}
              </div>

              {isSidebarOpen && isAgentsOpen && (
                <div className="dropdown-menu submenu">
                  <div className="menu-section">
                    <div
                      className={`section-header ${
                        openSection === "agentTickets" ? "" : "collapsed"
                      }`}
                      onClick={() => toggleSection("agentTickets")}
                    >
                      <span className="section-title">Ticket Overview</span>
                      <span className="section-count">
                        {ticketStats.total || 0}
                      </span>
                    </div>
                    {openSection === "agentTickets" && (
                      <div className="section-items">
                        {[
                          
                          {
                            label: "Assigned Tickets",
                            to: "/ticket/assigned",
                            value: ticketStats.assigned,
                            icon: "📋"
                          },
                          {
                            label: "In Progress",
                            to: "/ticket/opened",
                            value: ticketStats.open,
                            icon: "🔓"
                          },
                          // {
                          //   label: "In Progress",
                          //   to: "/ticket/in-progress",
                          //   value: ticketStats.inProgress,
                          //   icon: "⏳"
                          // },
                          // {
                          //   label: "Carried Forward",
                          //   to: "/ticket/carried-forward",
                          //   value: ticketStats.carriedForward,
                          //   icon: "↪️"
                          // },
                          {
                            label: "Closed Tickets",
                            to: "/ticket/closed",
                            value: ticketStats.closed,
                            icon: "🔒"
                          },
                          {
                            label: "Overdue",
                            to: "/ticket/overdue",
                            value: ticketStats.overdue,
                            icon: "⚠️"
                          },
                          {
                            label: "Total Tickets",
                            to: "/ticket/all",
                            value: ticketStats.total,
                            icon: "📊"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                  {fetchError && (
                    <div className="section error-message">
                      <span style={{ color: "red", padding: "0 1rem" }}>
                        {fetchError}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </li>
          </>
        )}
        {role === "coordinator" && (
          <>
            <li>
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
                to="/notifications"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdEmail className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Notifications</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/coordinator/ticket"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
                onClick={toggleAgentsDropdown}
                style={{ cursor: "pointer", padding: "11px 11px", textDecoration: "none" }}
              >
                <MdOutlineSupportAgent className="menu-icon" />
                {isSidebarOpen && (
                  <span className="menu-text">
                    Ticket Management{" "}
                    {isAgentsOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                )}
              </NavLink>

              {isSidebarOpen && isAgentsOpen && (
                <div className="dropdown-menu submenu coordinator-menu">
                  <div className="menu-section">
                    <div
                      className={`section-header ${
                        openSection === "newTickets" ? "" : "collapsed"
                      }`}
                      onClick={() => toggleSection("newTickets")}
                    >
                      <span className="section-title">New Tickets</span>
                      <span className="section-count">
                        {ticketStats.newTickets?.Total || 0}
                      </span>
                    </div>
                    {openSection === "newTickets" && (
                      <div className="section-items">
                        {[
                          {
                            label: "New Tickets",
                            to: `/coordinator/new`,
                            value: ticketStats.newTickets?.["New Tickets"] || 0,
                            icon: "🆕"
                          },
                          {
                            label: "Escalated",
                            to: `/coordinator/escalated`,
                            value:
                              ticketStats.newTickets?.["Escalated Tickets"] ||
                              0,
                            icon: "⚠️"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="menu-section">
                    <div
                      className={`section-header ${
                        openSection === "convertedTickets" ? "" : "collapsed"
                      }`}
                      onClick={() => toggleSection("convertedTickets")}
                    >
                      <span className="section-title">Tickets Category</span>
                      <span className="section-count">
                        {Object.values(
                          ticketStats.convertedTickets || {}
                        ).reduce((a, b) => a + b, 0)}
                      </span>
                    </div>
                    {openSection === "convertedTickets" && (
                      <div className="section-items">
                        {[
                          {
                            label: "Complaints",
                            to: "/coordinator/complaints",
                            value:
                              ticketStats.convertedTickets?.Complaints || 0,
                            icon: "📋"
                          },
                          {
                            label: "Suggestions",
                            to: "/coordinator/suggestions",
                            value:
                              ticketStats.convertedTickets?.Suggestions || 0,
                            icon: "💡"
                          },
                          {
                            label: "Compliments",
                            to: "/coordinator/complements",
                            value:
                              ticketStats.convertedTickets?.Compliments || 0,
                            icon: "⭐"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="menu-section">
                    <div
                      className={`section-header ${
                        openSection === "channeledTickets" ? "" : "collapsed"
                      }`}
                      onClick={() => toggleSection("channeledTickets")}
                    >
                      <span className="section-title">Channeled Tickets</span>
                      <span className="section-count">
                        {Object.values(
                          ticketStats.channeledTickets || {}
                        ).reduce((a, b) => a + b, 0)}
                      </span>
                    </div>
                    {openSection === "channeledTickets" && (
                      <div className="section-items">
                        {[
                          {
                            label: "Directorate",
                            to: "/coordinator/directorate",
                            value:
                              ticketStats.channeledTickets?.Directorate || 0,
                            icon: "🏢"
                          },
                          {
                            label: "Units",
                            to: "/coordinator/units",
                            value: ticketStats.channeledTickets?.Units || 0,
                            icon: "👥"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="menu-section">
                    <div
                      className={`section-header ${
                        openSection === "ticketStatus" ? "" : "collapsed"
                      }`}
                      onClick={() => toggleSection("ticketStatus")}
                    >
                      <span className="section-title">Ticket Status</span>
                      <span className="section-count">
                        {/* {(ticketStats.ticketStatus?.["On Progress"] || 0) + (ticketStats.ticketStatus?.Closed || 0)} */}
                        {ticketStats.ticketStatus?.Closed || 0}
                      </span>
                    </div>
                    {openSection === "ticketStatus" && (
                      <div className="section-items">
                        {[
                          // {
                          //   label: "On Progress",
                          //   to: "/coordinator/on-progress",
                          //   value:
                          //     ticketStats.ticketStatus?.["On Progress"] || 0,
                          //   icon: "⏳"
                          // },
                          {
                            label: "Closed",
                            to: `/coordinator/closed`,
                            value: ticketStats.ticketStatus?.Closed || 0,
                            icon: "🔒"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>

                  {fetchError && (
                    <div className="section error-message">
                      <span style={{ color: "red", padding: "0 1rem" }}>
                        {fetchError}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </li>
          </>
        )}
        {['focal-person', 'claim-focal-person', 'compliance-focal-person'].includes(role) && (
          <>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Focal Person Dashboard</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
              >
                <div className="menu-item">
                  <MdEmail className="menu-icon" />
                  {isSidebarOpen && (
                    <span className="menu-text">Notifications</span>
                  )}
                </div>
              </NavLink>
              <NavLink
                to="/focal-person/ticket"
                className={({ isActive }) =>
                  isActive ? "menu-item active-link" : "menu-item"
                }
                onClick={toggleAgentsDropdown}
                style={{ cursor: "pointer", padding: "11px 11px", textDecoration: "none" }}
              >
                <MdOutlineSupportAgent className="menu-icon" />
                {isSidebarOpen && (
                  <span className="menu-text">
                    Ticket Management{" "}
                    {isAgentsOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                )}
              </NavLink>

              {isSidebarOpen && isAgentsOpen && (
                <div className="dropdown-menu submenu coordinator-menu">
                  <div className="menu-section">
                    <div
                      className={`section-header ${
                        openSection === "newTickets" ? "" : "collapsed"
                      }`}
                      onClick={() => toggleSection("newTickets")}
                    >
                      <span className="section-title">New Tickets</span>
                      <span className="section-count">
                        {ticketStats.newTickets?.Total || 0}
                      </span>
                    </div>
                    {openSection === "newTickets" && (
                      <div className="section-items">
                        {[
                          {
                            label: "New Tickets",
                            to: `/focal-person/new`,
                            value: ticketStats.newTickets?.["New Tickets"] || 0,
                            icon: "🆕"
                          },
                          {
                            label: "Escalated",
                            to: `/focal-person/escalated`,
                            value:
                              ticketStats.newTickets?.["Escalated Tickets"] ||
                              0,
                            icon: "⚠️"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="menu-section">
                    <div
                      className={`section-header ${
                        openSection === "ticketStatus" ? "" : "collapsed"
                      }`}
                      onClick={() => toggleSection("ticketStatus")}
                    >
                      <span className="section-title">Ticket Status</span>
                      <span className="section-count">
                        {(ticketStats.ticketStatus?.["Open"] || 0) + (ticketStats.ticketStatus?.Closed || 0)}
                        {/* {ticketStats.ticketStatus?.Closed || 0} */}
                      </span>
                    </div>
                    {openSection === "ticketStatus" && (
                      <div className="section-items">
                        {[
                          {
                            label: "Open",
                            to: "/focal-person/open",
                            value: ticketStats.ticketStatus?.Open || 0,
                            icon: "🔓"
                          },
                          {
                            label: "Assigned Attendees",
                            to: "/focal-person/assigned",
                            value: ticketStats.ticketStatus?.AssignedAttendees || 0,
                            icon: "👤"
                          },
                          {
                            label: "Closed",
                            to: "/focal-person/closed",
                            value: ticketStats.ticketStatus?.Closed || 0,
                            icon: "🔒"
                          }
                        ].map((item, idx) => (
                          <NavLink
                            key={idx}
                            to={item.to}
                            className={({ isActive }) =>
                              isActive
                                ? "dropdown-item active-link"
                                : "dropdown-item"
                            }
                            style={{ padding: "12px 20px" }}
                          >
                            <div className="metric-row">
                              <span className="metric-icon">{item.icon}</span>
                              <span className="metric-label">{item.label}</span>
                              <span className="metric-value">{item.value}</span>
                            </div>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>

                  {fetchError && (
                    <div className="section error-message">
                      <span style={{ color: "red", padding: "0 1rem" }}>
                        {fetchError}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </li>
          </>
        )}
      </ul>
    </aside>
  );
}
