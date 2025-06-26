// src/pages/call-center-pages/cal-center-ivr/IvrCardsPage.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { GiVrHeadset } from 'react-icons/gi';
import { MdOutlineAudiotrack } from 'react-icons/md';
import { TbActivityHeartbeat } from 'react-icons/tb';
import './IvrCardsPage.css';
const IvrCardsPage = () => {
  const isSidebarOpen = true; // set this to true or get the value from your sidebar state

  return (
    <div className="card-container">
      {/* <h1>IVR Section</h1> */}
      <div className="card">
        <NavLink to="/ivr-voices">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "IVR's Voices"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
        <NavLink to="/ivr-action">
          <div className="card-item">
            <TbActivityHeartbeat className="card-icon" />
            <span className="card-text">{isSidebarOpen && "IVR's Actions"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
        <NavLink to="/ivr-dtmf-mappings">
          <div className="card-item">
            <TbActivityHeartbeat className="card-icon" />
            <span className="card-text">{isSidebarOpen && "IVR's Mapping"}</span>
          </div>
        </NavLink>
      </div>
      {/* <div className="card">
        <NavLink to="/recorded-sounds">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "Recorded Sounds"}</span>
          </div>
        </NavLink>
      </div> */}
      <div className="card">
        <NavLink to="/ivr-holidays">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "IVR Holidays"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
        <NavLink to="/ivr-emegency">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "IVR Emergency Number"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
        <NavLink to="/voice-notes">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "Voice Notes Reports"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
        <NavLink to="/cdr-reports">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "IVR Reports"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
        <NavLink to="/ivr-interactions">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "IVR Interactions Reports"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
        <NavLink to="/livestream">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "Live Streaming"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
        <NavLink to="/recorded-audio">
          <div className="card-item">
            <MdOutlineAudiotrack className="card-icon" />
            <span className="card-text">{isSidebarOpen && "Recorded Audio"}</span>
          </div>
        </NavLink>
      </div>
      <div className="card">
  <NavLink to="/dtmf-stats">
    <div className="card-item">
      <MdOutlineAudiotrack className="card-icon" />
      <span className="card-text">{isSidebarOpen && "DTMF Usage Report"}</span>
    </div>
  </NavLink>
</div>

    </div>
  );
};

export default IvrCardsPage;
