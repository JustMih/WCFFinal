// src/pages/call-center-pages/cal-center-ivr/IvrCardsPage.jsx

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { GiVrHeadset } from "react-icons/gi";
import { MdOutlineAudiotrack } from "react-icons/md";
import { TbActivityHeartbeat } from "react-icons/tb";
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdArrowRoundBack } from "react-icons/io";
import "./IvrCardsPage.css";
import { IVR_CATEGORIES } from "./ivrConfig";

const IvrCardsPage = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  if (activeCategory) {
    const category = IVR_CATEGORIES.find((c) => c.key === activeCategory);
    return (
      <div className={"ivr-main-container ivr-has-bg"}>
        <button
          className="ivr-back-btn"
          onClick={() => setActiveCategory(null)}
        >
          <IoMdArrowRoundBack size={24} /> Back
        </button>
        <div className="ivr-category-title" style={{ color: category.color }}>
          {category.label}
        </div>
        <div className="ivr-cards-grid">
          {category.cards.map((card) => (
            <NavLink to={card.to} className="ivr-sub-card" key={card.to}>
              <div className="ivr-sub-card-icon">
                {card.icon ? <card.icon /> : null}
              </div>
              <div className="ivr-sub-card-label">{card.label}</div>
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ivr-main-container">
      <div className="ivr-central-card">
        <GiVrHeadset size={26} />
        <div className="ivr-central-label">IVR</div>
      </div>
      <div className="ivr-category-links">
        {IVR_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
          <div
            className="ivr-category-card"
            key={cat.key}
            style={{ borderColor: cat.color }}
            onClick={() => setActiveCategory(cat.key)}
          >
            <div className="ivr-category-icon" style={{ color: cat.color }}>
              {Icon ? <Icon size={cat.iconSize || 32} /> : null}
            </div>
            <div className="ivr-category-label">{cat.label}</div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default IvrCardsPage;
