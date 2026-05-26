import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MdOutlineAssessment } from "react-icons/md";
import { Collapse, List } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { REPORTS } from "../../../pages/call-center-pages/call-center-report/reportConfig";

export default function ReportsSidebarMenu({ isSidebarOpen }) {
  const location = useLocation();
  const reportsActive = location.pathname.startsWith("/reports");
  const [openReports, setOpenReports] = useState(reportsActive);

  if (!isSidebarOpen) {
    return (
      <NavLink
        to="/reports/voice-note"
        className={reportsActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"}
        title="Reports"
      >
        <span className="sidebar-nav-row sidebar-nav-row--icon-only">
          <MdOutlineAssessment className="menu-icon" />
        </span>
      </NavLink>
    );
  }

  return (
    <div className="sidebar-nav-group">
      <button
        type="button"
        onClick={() => setOpenReports((prev) => !prev)}
        className={`sidebar-nav-link sidebar-nav-toggle${reportsActive ? " active-link" : ""}`}
        aria-expanded={openReports}
      >
        <span className="sidebar-nav-row">
          <MdOutlineAssessment className="menu-icon" />
          <span className="menu-text">Reports</span>
          <span className="sidebar-nav-chevron">
            {openReports ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </span>
        </span>
      </button>
      <Collapse in={openReports} timeout={180} unmountOnExit>
        <List component="nav" disablePadding className="reports-sub-menu">
          {REPORTS.map((report) => (
            <li key={report.slug}>
              <NavLink
                to={`/reports/${report.slug}`}
                className={({ isActive }) =>
                  `sidebar-sub-link${isActive ? " active-link" : ""}`
                }
                title={report.label}
              >
                {report.label}
              </NavLink>
            </li>
          ))}
        </List>
      </Collapse>
    </div>
  );
}
