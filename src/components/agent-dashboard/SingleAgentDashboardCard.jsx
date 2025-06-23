import React, { useEffect, useState } from "react";
import { FiPhoneIncoming } from "react-icons/fi";
import { TbPhoneCheck, TbPhoneX } from "react-icons/tb";
import { HiPhoneOutgoing } from "react-icons/hi";
import CircularProgress from "@mui/material/CircularProgress";
import "./SingleAgentDashboardCard.css";
import { baseURL } from "../../config";

export default function SingleAgentDashboardCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const agentId = localStorage.getItem("extension");
    if (!agentId) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${baseURL}/calls/agent-calls/${agentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch agent stats");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setStats(null);
        setLoading(false);
      });
  }, []);

  // Fallback to zero if stats missing
  const safe = (obj, key, fallback = 0) => (obj && obj[key] != null ? obj[key] : fallback);

  return (
    <div className="dashboard-single-agent modern-agent-dashboard">
      {loading ? (
        <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 120 }}>
          <CircularProgress />
        </div>
      ) : (
        <>
          <div className="single-agent-card modern-agent-card inbound">
            <div className="single-agent-head">
              <FiPhoneIncoming fontSize={22} />
              <span>In-Bound Calls</span>
            </div>
            <div className="single-agent-stats-row">
              <div className="stat-block">
                <span className="stat-label">Total</span>
                <span className="stat-value inbound-color">{safe(stats && stats.inbound, "total")}</span>
              </div>
              <div className="stat-block">
                <span className="stat-label">Answered</span>
                <span className="stat-value answered-color">{safe(stats && stats.inbound, "answered")}</span>
              </div>
              <div className="stat-block">
                <span className="stat-label">Dropped</span>
                <span className="stat-value dropped-color">{safe(stats && stats.inbound, "dropped")}</span>
              </div>
              <div className="stat-block">
                <span className="stat-label">Lost</span>
                <span className="stat-value lost-color">{safe(stats && stats.inbound, "lost")}</span>
              </div>
            </div>
          </div>
          <div className="single-agent-card modern-agent-card outbound">
            <div className="single-agent-head">
              <HiPhoneOutgoing fontSize={22} />
              <span>Out-Bound Calls</span>
            </div>
            <div className="single-agent-stats-row">
              <div className="stat-block">
                <span className="stat-label">Total</span>
                <span className="stat-value outbound-color">{safe(stats && stats.outbound, "total")}</span>
              </div>
              <div className="stat-block">
                <span className="stat-label">Answered</span>
                <span className="stat-value answered-color">{safe(stats && stats.outbound, "answered")}</span>
              </div>
              <div className="stat-block">
                <span className="stat-label">Dropped</span>
                <span className="stat-value dropped-color">{safe(stats && stats.outbound, "dropped")}</span>
              </div>
              <div className="stat-block">
                <span className="stat-label">Lost</span>
                <span className="stat-value lost-color">{safe(stats && stats.outbound, "lost")}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 