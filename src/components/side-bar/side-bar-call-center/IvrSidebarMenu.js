import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Collapse, List } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { GiVrHeadset } from "react-icons/gi";
import { IVR_CATEGORIES } from "../../../pages/call-center-pages/cal-center-ivr/ivrConfig";

function isCategoryActive(location, category) {
  if (location.pathname === "/ivr-categories") {
    const tab = new URLSearchParams(location.search).get("tab");
    return tab === category.key;
  }
  return category.cards.some((card) => card.to === location.pathname);
}

export default function IvrSidebarMenu({
  isSidebarOpen,
  onExpandedChange,
  forceOpen = false,
}) {
  const location = useLocation();

  const ivrRoutes = useMemo(
    () => IVR_CATEGORIES.flatMap((cat) => cat.cards.map((c) => c.to)),
    []
  );

  const ivrActive =
    location.pathname === "/ivr-cards" ||
    location.pathname === "/ivr-categories" ||
    ivrRoutes.includes(location.pathname);

  const [openIvr, setOpenIvr] = useState(ivrActive);

  useEffect(() => {
    if (forceOpen) setOpenIvr(true);
  }, [forceOpen]);

  if (!isSidebarOpen) {
    return (
      <NavLink
        to="/ivr-categories?tab=audio"
        className={ivrActive ? "sidebar-nav-link active-link" : "sidebar-nav-link"}
        title="IVR Management"
      >
        <span className="sidebar-nav-row sidebar-nav-row--icon-only">
          <GiVrHeadset className="menu-icon" />
        </span>
      </NavLink>
    );
  }

  const handleToggle = () => {
    setOpenIvr((prev) => {
      const next = !prev;
      if (onExpandedChange) onExpandedChange(next);
      return next;
    });
  };

  return (
    <div className="sidebar-nav-group">
      <button
        type="button"
        onClick={handleToggle}
        className={`sidebar-nav-link sidebar-nav-toggle${ivrActive ? " active-link" : ""}`}
        aria-expanded={openIvr}
      >
        <span className="sidebar-nav-row">
          <GiVrHeadset className="menu-icon" />
          <span className="menu-text">IVR Management</span>
          <span className="sidebar-nav-chevron">
            {openIvr ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </span>
        </span>
      </button>

      <Collapse in={openIvr} timeout={180} unmountOnExit>
        <List component="nav" disablePadding className="ivr-sub-menu reports-sub-menu">
          {IVR_CATEGORIES.map((cat) => {
            const firstCard = cat.cards[0];
            const to = firstCard
              ? `/ivr-categories?tab=${encodeURIComponent(cat.key)}&item=${encodeURIComponent(firstCard.to)}`
              : `/ivr-categories?tab=${encodeURIComponent(cat.key)}`;

            return (
              <li key={cat.key}>
                <NavLink
                  to={to}
                  className={() =>
                    `sidebar-sub-link${isCategoryActive(location, cat) ? " active-link" : ""}`
                  }
                  title={cat.label}
                >
                  {cat.label}
                </NavLink>
              </li>
            );
          })}
        </List>
      </Collapse>
    </div>
  );
}
