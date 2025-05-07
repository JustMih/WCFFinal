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
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    assigned: 0,
    closed: 0,
    overdue: 0,
    carriedForward: 0,
  });
  const [fetchError, setFetchError] = useState(null);

  const role = localStorage.getItem("role");

  const fetchTicketCounts = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");

    if (!userId || !token) {
      setFetchError("Missing userId or token");
      return;
    }

    const url = `${baseURL}/ticket/count/${userId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        setFetchError(`Fetch failed: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      if (data.ticketStats) {
        setTicketStats({ ...data.ticketStats });
        setFetchError(null);
      } else {
        setFetchError("No ticketStats in response");
      }
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

  useEffect(() => {
    fetchTicketCounts();
  }, []);

  return (
    <aside className={`crm-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
      {isSidebarOpen && <img src={logo} alt="Avatar" className="crm-sidebar-logo" />}
      <ul>
        {role === "agent"  && (
          <>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "menu-item active-link" : "menu-item")}
              >
                <div className="menu-item">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Agent Dashboard</span>}
                </div>
              </NavLink>

              {/* <NavLink
                to="/message"
                className={({ isActive }) => (isActive ? "menu-item active-link" : "menu-item")}
              >
                <div className="menu-item">
                  <MdEmail className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Message</span>}
                </div>
              </NavLink> */}

              <div
                className={`menu-item ${window.location.pathname.startsWith("/ticket") ? "active-link" : ""}`}
                onClick={toggleAgentsDropdown}
                style={{ cursor: "pointer" }}
              >
                <MdOutlineSupportAgent className="menu-icon" />
                {isSidebarOpen && (
                  <span className="menu-text">
                    Ticket {isAgentsOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                )}
              </div>

              {isSidebarOpen && isAgentsOpen && (
                <div className="dropdown-menu submenu">
                  {[ 
                    { label: "Opened Tickets", to: "/ticket/opened", value: ticketStats.open },
                    { label: "Assigned Tickets", to: "/ticket/assigned", value: ticketStats.assigned },
                    { label: "In Progress", to: "/ticket/in-progress", value: ticketStats.inProgress },
                    { label: "Carried Forward", to: "/ticket/carried-forward", value: ticketStats.carriedForward },
                    { label: "Closed Tickets", to: "/ticket/closed", value: ticketStats.closed },
                    { label: "Overdue", to: "/ticket/overdue", value: ticketStats.overdue },
                    { label: "Total Tickets", to: "/ticket/all", value: ticketStats.total },
                  ].map((item, idx) => (
                    <NavLink
                      key={idx}
                      to={item.to}
                      className={({ isActive }) => (isActive ? "dropdown-item active-link" : "dropdown-item")}
                    >
                      <div className="metric-row">
                        <span className="metric-label">{item.label}</span>
                        <span className="metric-value">{item.value}</span>
                      </div>
                    </NavLink>
                  ))}
                  {fetchError && (
                    <div className="section error-message">
                      <span style={{ color: "red", padding: "0 1rem" }}>{fetchError}</span>
                    </div>
                  )}
                </div>
              )}
            </li>
          </>
        )}
   {role==="attendee" && (
          <>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "menu-item active-link" : "menu-item")}
              >
                <div className="menu-item">
                  <RxDashboard className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Attendee Dashboard</span>}
                </div>
              </NavLink>

              {/* <NavLink
                to="/message"
                className={({ isActive }) => (isActive ? "menu-item active-link" : "menu-item")}
              >
                <div className="menu-item">
                  <MdEmail className="menu-icon" />
                  {isSidebarOpen && <span className="menu-text">Message</span>}
                </div>
              </NavLink> */}

              <div
                className={`menu-item ${window.location.pathname.startsWith("/ticket") ? "active-link" : ""}`}
                onClick={toggleAgentsDropdown}
                style={{ cursor: "pointer" }}
              >
                <MdOutlineSupportAgent className="menu-icon" />
                {isSidebarOpen && (
                  <span className="menu-text">
                    Ticket {isAgentsOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                )}
              </div>

              {isSidebarOpen && isAgentsOpen && (
                <div className="dropdown-menu submenu">
                  {[ 
                    { label: "Opened Tickets", to: "/ticket/opened", value: ticketStats.open },
                    { label: "Assigned Tickets", to: "/ticket/assigned", value: ticketStats.assigned },
                    { label: "In Progress", to: "/ticket/in-progress", value: ticketStats.inProgress },
                    { label: "Carried Forward", to: "/ticket/carried-forward", value: ticketStats.carriedForward },
                    { label: "Closed Tickets", to: "/ticket/closed", value: ticketStats.closed },
                    { label: "Overdue", to: "/ticket/overdue", value: ticketStats.overdue },
                    { label: "Total Tickets", to: "/ticket/all", value: ticketStats.total },
                  ].map((item, idx) => (
                    <NavLink
                      key={idx}
                      to={item.to}
                      className={({ isActive }) => (isActive ? "dropdown-item active-link" : "dropdown-item")}
                    >
                      <div className="metric-row">
                        <span className="metric-label">{item.label}</span>
                        <span className="metric-value">{item.value}</span>
                      </div>
                    </NavLink>
                  ))}
                  {fetchError && (
                    <div className="section error-message">
                      <span style={{ color: "red", padding: "0 1rem" }}>{fetchError}</span>
                    </div>
                  )}
                </div>
              )}
            </li>
          </>
        )}
{role === "coordinator" && (
  <>
    {/* <li>
      <NavLink
        to="/"
        className={({ isActive }) => (isActive ? "menu-item active-link" : "menu-item")}
      >
        <div className="menu-item">
          <RxDashboard className="menu-icon" />
          {isSidebarOpen && <span className="menu-text">Home</span>}
        </div>
      </NavLink>
    </li> */}
    {/* <li>
      <NavLink
        to="/message"
        className={({ isActive }) => (isActive ? "menu-item active-link" : "menu-item")}
      >
        <div className="menu-item">
          <MdEmail className="menu-icon" />
          {isSidebarOpen && <span className="menu-text">Message</span>}
        </div>
      </NavLink>
    </li> */}
    <li>
      <NavLink
        to="/coordinator"
        className={({ isActive }) => (isActive ? "menu-item active-link" : "menu-item")}
      >
        <div className="menu-item">
          <MdOutlineSupportAgent className="menu-icon" />
          {isSidebarOpen && <span className="menu-text">Coordinator Dashboard</span>}
        </div>
      </NavLink>
    </li>
  </>
)}
      </ul>
    </aside>
  );
}
