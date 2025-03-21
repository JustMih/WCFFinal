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

export default function Navbar({
  toggleTheme,
  isDarkMode,
  toggleSidebar,
  isSidebarOpen,
  role,
  setActiveSystem,
  activeSystem,
}) {
  const [username, setUserName] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("username"));
  }, []);

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
        localStorage.removeItem("activeSystem");
        window.location.href = "/login";
        return;
      }
      const response = await fetch(`${baseURL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
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
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const canAccessCallCenter =
    role === "admin" || role === "super-admin" || role === "agent" || role === "supervisor";
  const canAccessCRM =
    role === "admin" ||
    role === "super-admin" ||
    role === "agent" ||
    role === "attendee" ||
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
    </nav>
  );
}
