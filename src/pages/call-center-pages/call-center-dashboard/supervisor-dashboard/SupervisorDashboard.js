import React from "react";
import { BsClockHistory } from "react-icons/bs";
import { LuClock2, LuClock12, LuClockAlert } from "react-icons/lu";

export default function SupervisorDashboard() {
  return (
    <div className="call-center-agent-container">
      <h3 className="call-center-agent-title">supervisor dashboard</h3>
      <div className="call-center-agent-summary">
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <BsClockHistory />
              <p className="call-center-agent-value">01:46 sec</p>
            </div>
            <h4>Longest call waiting</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <LuClock2 />
              <p className="call-center-agent-value">05:46 sec</p>
            </div>
            <h4>Average Talk Time</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <LuClock12 />
              <p className="call-center-agent-value">146</p>
            </div>
            <h4>Total Call</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <LuClockAlert />
              <p className="call-center-agent-value">20</p>
            </div>
            <h4>Total Abandoned call</h4>
          </div>
        </div>
      </div>
    </div>
  );
}
