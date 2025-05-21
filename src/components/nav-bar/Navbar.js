import React, { useState, useEffect } from "react";
import { RiMenuFoldLine, RiMenuFold2Line } from "react-icons/ri";
import { LuSunMoon } from "react-icons/lu";
import { MdPerson, MdDarkMode } from "react-icons/md";
import { FaSignOutAlt, FaCog } from "react-icons/fa";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { TfiLayoutMediaCenterAlt } from "react-icons/tfi";
import { BsFillTicketDetailedFill } from "react-icons/bs";
import { baseURL } from "../../config";
import "./navbar.css";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Badge } from "@mui/material";
import CoordinatorActionModal from "../coordinator/CoordinatorActionModal";

export default function Navbar({
  toggleTheme,
  isDarkMode,
  toggleSidebar,
  isSidebarOpen,
  role,
  setActiveSystem,
  activeSystem
}) {
  const [username, setUserName] = useState("");
  const [assignedCount, setAssignedCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [modalTicket, setModalTicket] = useState(null);
  const [convertCategory, setConvertCategory] = useState({});
  const [forwardUnit, setForwardUnit] = useState({});
  const [units, setUnits] = useState([]);
  const categories = ["Inquiry"]; // Add more if needed
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    setUserName(localStorage.getItem("username"));
  }, []);

  useEffect(() => {
    // Fetch assigned ticket notification count
    async function fetchAssignedCount() {
      try {
        const response = await fetch(
          `${baseURL}/notifications/unread-count/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAssignedCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Error fetching notification count:", err);
        setAssignedCount(0);
      }
    }
    if (userId && token) fetchAssignedCount();
  }, [userId, token]);

  useEffect(() => {
    // Fetch notifications for the user (for dropdown only)
    async function fetchNotifications() {
      try {
        const response = await fetch(
          `${baseURL}/notifications/user/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      }
    }
    if (userId && token) fetchNotifications();
  }, [userId, token]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const fetchUnits = async () => {
      try {
        const res = await fetch(`${baseURL}/section/units-data`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setUnits(json.data || []);
      } catch (err) {
        console.error("Error fetching units:", err);
      }
    };
    if (token) fetchUnits();
  }, []);

  const handleCategoryChange = (ticketId, value) => {
    setConvertCategory(prev => ({
      ...prev,
      [ticketId]: value
    }));
  };

  const handleUnitChange = (ticketId, value) => {
    setForwardUnit(prev => ({
      ...prev,
      [ticketId]: value
    }));
  };

  const handleConvertOrForward = (ticketId) => {
    alert("Convert/Forward not implemented in Navbar. Please use the dashboard.");
  };

  const handleRating = (ticketId, rating) => {
    alert("Rating not implemented in Navbar. Please use the dashboard.");
  };

  const handleNotificationClick = async (notif) => {
    console.log("Notification clicked:", notif);
    try {
      // First mark notification as read
      await fetch(`${baseURL}/notifications/read/${notif.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      // Then fetch ticket details if we have a ticket_id
      if (notif.ticket_id) {
        const response = await fetch(`${baseURL}/ticket/${notif.ticket_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Ticket data received:", data);
          
          // Check if we have the ticket data in the expected format
          if (data && data.ticket) {
            setModalTicket(data.ticket);
            setIsActionModalOpen(true);
            setNotifDropdownOpen(false);
          } else if (data && data.id) {
            // If the response is the ticket object directly
            setModalTicket(data);
            setIsActionModalOpen(true);
            setNotifDropdownOpen(false);
          } else {
            console.error("Unexpected ticket data format:", data);
            alert("Ticket details not found or in unexpected format.");
          }
        } else {
          console.error("Failed to fetch ticket:", response.status);
          alert("Failed to fetch ticket details.");
        }
      } else {
        console.error("No ticket_id in notification:", notif);
        alert("No ticket associated with this notification.");
      }
    } catch (err) {
      console.error("Error in handleNotificationClick:", err);
      alert("Error processing notification.");
    }
  };

  const handleLogout = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("User ID is not available.");
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        localStorage.removeItem("tokenExpiration");
        localStorage.removeItem("agentStatus");
        localStorage.removeItem("activeSystem");
        window.location.href = "/";
        return;
      }
      const response = await fetch(`${baseURL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error("Failed to log out");
      }
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("tokenExpiration");
      localStorage.removeItem("activeSystem");
      localStorage.removeItem("agentStatus");
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const canAccessCallCenter =
    role === "admin" ||
    role === "super-admin" ||
    role === "agent" ||
    role === "supervisor";
  const canAccessCRM =
    role === "admin" ||
    role === "super-admin" ||
    role === "agent" ||
    role === "attendee" ||
    role === "coordinator" ||
    role === "supervisor";

  const handleSystemSwitch = (system) => {
    localStorage.setItem("activeSystem", system); // Save active system to localStorage
    setActiveSystem(system);
  };

  const getActiveButtonClass = (system) => {
    return activeSystem === system ? "active-button" : "";
  };

  return (
    <nav className="navbar">
      <div className={`navbar-left ${isSidebarOpen ? "open" : "closed"}`}>
        {isSidebarOpen ? (
          <RiMenuFoldLine className="menu-icon" onClick={toggleSidebar} />
        ) : (
          <RiMenuFold2Line className="menu-icon" onClick={toggleSidebar} />
        )}
        {canAccessCallCenter && (
          <Tooltip title="Call Center">
            <IconButton
              onClick={() => handleSystemSwitch("call-center")}
              className={getActiveButtonClass("call-center")}
            >
              <TfiLayoutMediaCenterAlt className="navbar-system-icons" />
            </IconButton>
          </Tooltip>
        )}
        {canAccessCRM && (
          <Tooltip title="CRM">
            <IconButton
              onClick={() => handleSystemSwitch("crm")}
              className={getActiveButtonClass("crm")}
            >
              <BsFillTicketDetailedFill className="navbar-system-icons" />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <div className="navbar-right">
        <button className="theme-button" onClick={toggleTheme}>
          {isDarkMode ? <LuSunMoon /> : <MdDarkMode />}
        </button>
        {/* Notification Bell with Dropdown */}
        <div
          className="navbar-notification-container"
          style={{
            marginRight: "1rem",
            cursor: "pointer",
            position: "relative"
          }}
          onClick={() => setNotifDropdownOpen((open) => !open)}
        >
          {console.log("assignedCount", assignedCount)}
          <Badge
            badgeContent={assignedCount}
            color="error"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#ff0000",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.6rem",
                minWidth: "20px",
                height: "20px",
                borderRadius: "10px",
                top: "2px", // Move badge up (more negative = closer to icon)
                right: "10px", // Move badge left (more negative = closer to icon)
                zIndex: 1 // Fine-tune the badge positioning
              }
            }}
          >
            <IoMdNotificationsOutline size={24} className="navbar-icon" />
          </Badge>
          {notifDropdownOpen && (
            <div className="navbar-notification-dropdown">
              {notifications.length === 0 ? (
                <div className="notification-empty">No notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.status === "unread" ? "unread" : ""}`}
                  >
                    <div
                      className="notification-message"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        console.log("Message clicked", notif);
                        handleNotificationClick(notif);
                      }}
                    >
                      {notif.message}
                    </div>
                    <div className="notification-type">
                      {notif.category || notif.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="navbar-profile-container">
          <span className="navbar-profile">
            <MdPerson className="navbar-profile-icon" />
            {username}, {role}
          </span>
          <div className="navbar-dropdown-menu">
            <button
              className="navbar-service-button active"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="menu-icon" /> Logout
            </button>
            <button
              className="navbar-service-button"
              onClick={() => {
                console.log("Settings");
              }}
            >
              <FaCog className="menu-icon" /> Settings
            </button>
          </div>
        </div>
      </div>
      <CoordinatorActionModal
        open={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        ticket={modalTicket}
        categories={categories}
        units={units}
        convertCategory={convertCategory}
        forwardUnit={forwardUnit}
        handleCategoryChange={handleCategoryChange}
        handleUnitChange={handleUnitChange}
        handleConvertOrForward={handleConvertOrForward}
        handleRating={handleRating}
      />
      {console.log("Modal open:", isActionModalOpen, "Ticket:", modalTicket)}
    </nav>
  );
}
