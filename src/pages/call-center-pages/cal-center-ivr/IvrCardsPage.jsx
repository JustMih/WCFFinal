// src/pages/call-center-pages/cal-center-ivr/IvrCardsPage.jsx

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { GiVrHeadset } from 'react-icons/gi';
import { MdOutlineAudiotrack } from 'react-icons/md';
import { TbActivityHeartbeat } from 'react-icons/tb';
import { FaRegFileAlt } from 'react-icons/fa';
import { IoMdArrowRoundBack } from 'react-icons/io';
import './IvrCardsPage.css';

const categories = [
  {
    key: 'audio',
    label: 'Audio Files',
    icon: <MdOutlineAudiotrack size={32} />,
    color: '#2563eb',
    cards: [
      { to: '/ivr-voices', label: "IVR's Voices", icon: <MdOutlineAudiotrack /> },
      { to: '/recorded-audio', label: 'Recorded Calls', icon: <MdOutlineAudiotrack /> },
      { to: '/voice-notes', label: 'Voice Notes', icon: <MdOutlineAudiotrack /> },
    ],
  },
  {
    key: 'actions',
    label: 'IVR Actions',
    icon: <TbActivityHeartbeat size={32} />,
    color: '#10b981',
    cards: [
      { to: '/ivr-dtmf-mappings', label: "IVR's Mapping", icon: <TbActivityHeartbeat /> },
      { to: '/ivr-action', label: "IVR's Actions", icon: <TbActivityHeartbeat /> },
      { to: '/ivr-emegency', label: 'IVR Emergency Number', icon: <MdOutlineAudiotrack /> },
      { to: '/ivr-holidays', label: 'IVR Holidays', icon: <MdOutlineAudiotrack /> },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: <FaRegFileAlt size={32} />,
    color: '#f59e42',
    cards: [
      { to: '/cdr-reports', label: 'IVR Reports', icon: <MdOutlineAudiotrack /> },
      { to: '/ivr-interactions', label: 'IVR Interactions Reports', icon: <MdOutlineAudiotrack /> },
      { to: '/livestream', label: 'Live Streaming', icon: <MdOutlineAudiotrack /> },
      { to: '/dtmf-stats', label: 'DTMF Usage Report', icon: <MdOutlineAudiotrack /> },
    ],
  },
];

const IvrCardsPage = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  if (activeCategory) {
    const category = categories.find((c) => c.key === activeCategory);
    return (
      <div className={"ivr-main-container ivr-has-bg"}>
        <button className="ivr-back-btn" onClick={() => setActiveCategory(null)}>
          <IoMdArrowRoundBack size={24} /> Back
        </button>
        <div className="ivr-category-title" style={{ color: category.color }}>{category.label}</div>
        <div className="ivr-cards-grid">
          {category.cards.map((card) => (
            <NavLink to={card.to} className="ivr-sub-card" key={card.to}>
              <div className="ivr-sub-card-icon">{card.icon}</div>
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
        {categories.map((cat) => (
          <div
            className="ivr-category-card"
            key={cat.key}
            style={{ borderColor: cat.color }}
            onClick={() => setActiveCategory(cat.key)}
          >
            <div className="ivr-category-icon" style={{ color: cat.color }}>{cat.icon}</div>
            <div className="ivr-category-label">{cat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IvrCardsPage;
