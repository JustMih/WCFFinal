import React from "react";
import { MdOutlineSupportAgent, MdPhonePaused } from "react-icons/md";
import { CiLogin, CiLogout } from "react-icons/ci";
import { BiSolidLeftDownArrowCircle } from "react-icons/bi";
import { VscVmActive } from "react-icons/vsc";
import { AiOutlinePauseCircle } from "react-icons/ai";
import { SiTransmission } from "react-icons/si";
import "./agents.css";

export default function Agents() {
  return (
    <div className="p-6">
      <h3 className="agent-title">Agents Statistics</h3>
      <div className="agent-summary">
        <div className="agent-card">
          <div className="agent-card-icon">
            <div className="agent-data">
              <MdOutlineSupportAgent />
              <p className="agent-value">5</p>
            </div>
            <h4>Total Agents</h4>
          </div>
        </div>
        <div className="agent-card">
          <div className="agent-card-icon">
            <div className="agent-data">
              <CiLogin />
              <p className="agent-value">3</p>
            </div>
            <h4>Logged In</h4>
          </div>
        </div>
        <div className="agent-card">
          <div className="agent-card-icon">
            <div className="agent-data">
              <CiLogout />
              <p className="agent-value">2</p>
            </div>
            <h4>Logged Off</h4>
          </div>
        </div>
        <div className="agent-card">
          <div className="agent-card-icon">
            <div className="agent-data">
              <BiSolidLeftDownArrowCircle />
              <p className="agent-value">0</p>
            </div>
            <h4>Idle</h4>
          </div>
        </div>
      </div>
      <div className="agent-summary">
        <div className="agent-card">
          <div className="agent-card-icon">
            <div className="agent-data">
              <VscVmActive />
              <p className="agent-value">1</p>
            </div>
            <h4>Active</h4>
          </div>
        </div>
        <div className="agent-card">
          <div className="agent-card-icon">
            <div className="agent-data">
              <AiOutlinePauseCircle />
              <p className="agent-value">0</p>
            </div>
            <h4>Pause</h4>
          </div>
        </div>
        <div className="agent-card">
          <div className="agent-card-icon">
            <div className="agent-data">
              <MdPhonePaused />
              <p className="agent-value">0</p>
            </div>
            <h4>Force Pause</h4>
          </div>
        </div>
        <div className="agent-card">
          <div className="agent-card-icon">
            <div className="agent-data">
              <SiTransmission />
              <p className="agent-value">0</p>
            </div>
            <h4>Mission</h4>
          </div>
        </div>
      </div>
      <div className="agent-table-container">
        <table className="agent-table">
          <thead>
            <tr>
              <th>Sn</th>
              <th>ID</th>
              <th>Ext</th>
              <th>Name</th>
              <th>Status</th>
              <th>Login Duration</th>
              <th>Pause Duration</th>
              <th>Mission Duration</th>
              <th>Agent Actions</th>
              <th>Calls</th>
              <th>RNA</th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    </div>
  );
}
