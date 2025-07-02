import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import logo from "../../../asserts/images/logo.png";
import { MdOutlineSupportAgent, MdEmail } from "react-icons/md";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import { baseURL } from "../../../config";
import "./crmSidebar.css";
import axios from "axios";

export default function CRMSidebar({ isSidebarOpen }) {
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [openCount, setOpenCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [carriedForwardCount, setCarriedForwardCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [fetchError, setFetchError] = useState("");

  const role = localStorage.getItem("role");

  const getDashboardTitle = (role) => {
    if (role === "focal-person") return "Focal Person Dashboard";
    if (role === "claim-focal-person") return "Claim Focal Person Dashboard";
    if (role === "compliance-focal-person") return "Compliance Focal Person Dashboard";
    if (role === "head-of-unit") return "Head of Unit Dashboard";
    if (role === "coordinator") return "Coordinator Dashboard";
    if (role === "agent" || role === "attendee") return "Agent Dashboard";
    return "Dashboard";
  };

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;
    setFetchError("");
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [openRes, assignedRes, inProgressRes, carriedForwardRes, closedRes, overdueRes] = await Promise.all([
          axios.get(`${baseURL}/ticket/count/open/${userId}`, config),
          axios.get(`${baseURL}/ticket/count/assigned/${userId}`, config),
          axios.get(`${baseURL}/ticket/count/inprogress/${userId}`, config),
          axios.get(`${baseURL}/ticket/count/carried-forward/${userId}`, config),
          axios.get(`${baseURL}/ticket/count/closed/${userId}`, config),
          axios.get(`${baseURL}/ticket/count/overdue/${userId}`, config),
        ]);
        setOpenCount(openRes.data.count || 0);
        setAssignedCount(assignedRes.data.count || 0);
        setInProgressCount(inProgressRes.data.count || 0);
        setCarriedForwardCount(carriedForwardRes.data.count || 0);
        setClosedCount(closedRes.data.count || 0);
        setOverdueCount(overdueRes.data.count || 0);
        setTotalCount(
          (openRes.data.count || 0) +
          (assignedRes.data.count || 0) +
          (inProgressRes.data.count || 0) +
          (carriedForwardRes.data.count || 0) +
          (closedRes.data.count || 0) +
          (overdueRes.data.count || 0)
        );
      } catch (err) {
        console.error('Error fetching ticket counts:', err);
        let errorMsg = 'Failed to fetch ticket counts';
        if (err.response) {
          errorMsg += ` (Status: ${err.response.status})`;
          if (err.response.data && err.response.data.message) {
            errorMsg += `: ${err.response.data.message}`;
          }
        } else if (err.request) {
          errorMsg += ' (No response from server)';
        } else if (err.message) {
          errorMsg += ` (${err.message})`;
        }
        setFetchError(errorMsg);
      }
    };
    fetchCounts();
  }, [userId]);

  const toggleAgentsDropdown = () => {
    if (!isAgentsOpen) {
      // fetchTicketCounts();
    }
    setIsAgentsOpen((prev) => !prev);
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <aside className={`crm-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      {isSidebarOpen && (
        <img src={logo} alt="Avatar" className="crm-sidebar-logo" />
      )}
      <ul>
        {(
          role === "agent" ||
          role === "attendee" ||
          role === "head-of-unit" ||
          role === "manager" ||
          role === "supervisor" ||
          role === "director-general" ||
          role === "director" ||
          role === "admin" ||
          role === "super-admin" ||
          role === "focal-person" ||
          role === "claim-focal-person" ||
          role === "compliance-focal-person"
        ) && (
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
                    <span className="menu-text">{getDashboardTitle(role)}</span>
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
                      <span className="section-count">{totalCount}</span>
                    </div>
                    {openSection === "agentTickets" && (
                      <div className="section-items">
                        {[
                          {
                            label: "Assigned Tickets",
                            to: "/ticket/assigned",
                            value: assignedCount,
                            icon: "📋"
                          },
                          {
                            label: "In Progress",
                            to: "/ticket/in-progress",
                            value: inProgressCount,
                            icon: "⏳"
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
                            value: closedCount,
                            icon: "🔒"
                          },
                          {
                            label: "Overdue",
                            to: "/ticket/overdue",
                            value: overdueCount,
                            icon: "⚠️"
                          },
                          {
                            label: "Total Tickets",
                            to: "/ticket/all",
                            value: totalCount,
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
                    <span className="menu-text">{getDashboardTitle(role)}</span>
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
                        {/* {(ticketStats.ticketStatus?.["On Progress"] || 0) + (ticketStats.ticketStatus?.Closed || 0)} */}
                        {/* {(ticketStats.newTickets?.["New Tickets"] || 0) + (ticketStats.newTickets?.["Escalated Tickets"] || 0)} */}
                        {/* {(ticketStats.newTickets?.["New Tickets"] || 0) + (ticketStats.newTickets?.["Escalated Tickets"] || 0)} */}
                      </span>
                    </div>
                    {openSection === "newTickets" && (
                      <div className="section-items">
                        {[
                          {
                            label: "New Tickets",
                            to: `/coordinator/new`,
                            value: 0,
                            icon: "🆕"
                          },
                          {
                            label: "Escalated",
                            to: `/coordinator/escalated`,
                            value: 0,
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
                        {/* {Object.values(
                          ticketStats.convertedTickets || {}
                        ).reduce((a, b) => a + b, 0)} */}
                      </span>
                    </div>
                    {openSection === "convertedTickets" && (
                      <div className="section-items">
                        {[
                          {
                            label: "Complaints",
                            to: "/coordinator/complaints",
                            value: 0,
                            icon: "📋"
                          },
                          {
                            label: "Suggestions",
                            to: "/coordinator/suggestions",
                            value: 0,
                            icon: "💡"
                          },
                          {
                            label: "Compliments",
                            to: "/coordinator/complements",
                            value: 0,
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
                        {/* {Object.values(
                          ticketStats.channeledTickets || {}
                        ).reduce((a, b) => a + b, 0)} */}
                      </span>
                    </div>
                    {openSection === "channeledTickets" && (
                      <div className="section-items">
                        {[
                          {
                            label: "Directorate",
                            to: "/coordinator/directorate",
                            value: 0,
                            icon: "🏢"
                          },
                          {
                            label: "Units",
                            to: "/coordinator/units",
                            value: 0,
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
                        {/* {(ticketStats.ticketStatus?.["On Progress"] || 0) + (ticketStats.ticketStatus?.Closed || 0)} */}
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
                            value: 0,
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

                  {/* {fetchError && (
                    <div className="section error-message">
                      <span style={{ color: "red", padding: "0 1rem" }}>
                        {fetchError}
                      </span>
                    </div>
                  )} */}
                </div>
              )}
            </li>
          </>
        )}
      </ul>
    </aside>
  );
}
