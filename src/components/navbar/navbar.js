import React, { useState, useEffect } from "react";
import "./navbar.css";
import { RiMenuFoldLine, RiMenuFold2Line } from "react-icons/ri";
import { LuSunMoon } from "react-icons/lu";
import { MdPerson, MdDarkMode } from "react-icons/md";
import { FaSignOutAlt, FaCog } from "react-icons/fa";

const Navbar = ({
  toggleSidebar,
  isSidebarOpen,
  toggleTheme,
  isDarkMode,
  handleLogout,
}) => {
  const [username, setUserName] = useState("");
  const [role, setRole] = useState("");

  // Set the username from localStorage when the component mounts
  useEffect(() => {
    setUserName(localStorage.getItem("username"));
    setRole(localStorage.getItem("role"));
  }, []); // Empty dependency array ensures this only runs once when the component mounts

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {isSidebarOpen ? (
          <RiMenuFoldLine className="icon" onClick={toggleSidebar} />
        ) : (
          <RiMenuFold2Line className="icon" onClick={toggleSidebar} />
        )}
        <span className="region">WCF Call Center Management.</span>
        {/* <img src={logo} alt="Avatar" className="logo" /> */}
      </div>
      <div className="navbar-right">
        <button className="theme-button" onClick={toggleTheme}>
          {isDarkMode ? <LuSunMoon /> : <MdDarkMode />}
          {/* <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span> */}
        </button>
        <div className="profile-container">
          <span className="profile">
            <MdPerson className="profile-icon" />
            {username}, {role}
          </span>
          <div className="dropdown-menu">
            <button className="service-button active" onClick={handleLogout}>
              <FaSignOutAlt className="menu-icon" /> Logout
            </button>
            <button
              className="service-button"
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
};

export default Navbar;
