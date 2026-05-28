import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, Tab } from "@mui/material";
import { IVR_CATEGORIES } from "./ivrConfig";
import { IVR_PAGE_COMPONENTS } from "./ivrPageComponents";
import "./IvrCategoryTabsPage.css";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function IvrCategoryTabsPage() {
  const navigate = useNavigate();
  const params = useQueryParams();

  const categoryKey = params.get("tab") || IVR_CATEGORIES[0]?.key || "audio";
  const category =
    IVR_CATEGORIES.find((c) => c.key === categoryKey) || IVR_CATEGORIES[0];

  const cards = category?.cards || [];
  const itemPath = params.get("item") || cards[0]?.to || "";

  const tabIndex = Math.max(
    0,
    cards.findIndex((c) => c.to === itemPath)
  );

  const activeCard = cards[tabIndex] || cards[0];
  const ActiveComponent = activeCard
    ? IVR_PAGE_COMPONENTS[activeCard.to]
    : null;

  useEffect(() => {
    if (!cards.length) return;
    const validItem = cards.some((c) => c.to === itemPath);
    if (!validItem) {
      navigate(
        `/ivr-categories?tab=${encodeURIComponent(categoryKey)}&item=${encodeURIComponent(cards[0].to)}`,
        { replace: true }
      );
    }
  }, [cards, categoryKey, itemPath, navigate]);

  const handleTabChange = (_e, newIndex) => {
    const card = cards[newIndex];
    if (!card) return;
    navigate(
      `/ivr-categories?tab=${encodeURIComponent(categoryKey)}&item=${encodeURIComponent(card.to)}`
    );
  };

  return (
    <div className="ivr-tabs-page">
      <div className="ivr-tabs-header">
        <h3 className="ivr-tabs-title">{category?.label || "IVR Management"}</h3>
      </div>

      <div className="ivr-tabs-controls">
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {cards.map((card) => (
            <Tab key={card.to} label={card.label} />
          ))}
        </Tabs>
      </div>

      <div className="ivr-tabs-panel">
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <p className="ivr-tabs-empty">No content available for this section.</p>
        )}
      </div>
    </div>
  );
}
