import React, { useEffect, useState } from "react";
import { FiPhoneIncoming } from "react-icons/fi";
import { HiPhoneOutgoing } from "react-icons/hi";
import { TbPhoneX, TbMail } from "react-icons/tb";
import { FaWhatsapp, FaInstagram, FaXTwitter } from "react-icons/fa6";
import CircularProgress from "@mui/material/CircularProgress";
import "./SingleAgentDashboardCard.css";
import { baseURL } from "../../config";

export default function SingleAgentDashboardCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voiceNotes, setVoiceNotes] = useState([]);

  useEffect(() => {
    const agentId = localStorage.getItem("extension");
    if (!agentId) {
      setStats(null);
      setLoading(false);
    } else {
      setLoading(true);
      fetch(`${baseURL}/calls/agent-calls-today/${agentId}`)
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
    }

    // Fetch voice notes (not blocking primary loading spinner)
    fetch(`${baseURL}/voice-notes`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch voice notes");
        return res.json();
      })
      .then((data) => {
        // Expecting an array; if not, coerce safely
        setVoiceNotes(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setVoiceNotes([]));
  }, []);

  const safe = (obj, key, fallback = 0) => (obj && obj[key] != null ? obj[key] : fallback);

  // Returns the first non-null value by trying multiple key aliases
  const getValue = (obj, keys, fallback = 0) => {
    if (!obj) return fallback;
    for (const key of keys) {
      if (obj[key] != null) return obj[key];
    }
    return fallback;
  };

  const normalizeBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";

  const isVoiceNotePlayed = (note) => {
    if (!note || typeof note !== "object") return false;
    const status = (note.status || note.play_status || note.playStatus || "").toString().toLowerCase();
    return (
      normalizeBoolean(note.played) ||
      normalizeBoolean(note.isPlayed) ||
      normalizeBoolean(note.is_played) ||
      status === "played" ||
      Boolean(note.played_at || note.playedAt)
    );
  };

  const getNoteAgentId = (note) => note?.extension ?? note?.agentId ?? note?.agent_id ?? note?.agent ?? null;

  const renderCard = (type, IconComponent, title, dataKey, colorClass) => (
    <div className={`single-agent-card modern-agent-card ${type}`}>
      <div className="single-agent-head">
        <IconComponent fontSize={22} />
        <span>{title}</span>
      </div>
      <div className="single-agent-stats-row">
        <div className="stat-block">
          <span className="stat-label">Total</span>
          <span className={`stat-value ${colorClass}-color`}>{safe(stats?.[dataKey], "total")}</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Answered</span>
          <span className="stat-value answered-color">{safe(stats?.[dataKey], "answered")}</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Dropped</span>
          <span className="stat-value dropped-color">{safe(stats?.[dataKey], "dropped")}</span>
        </div>
        <div className="stat-block">
          <span className="stat-label">Lost</span>
          <span className="stat-value lost-color">{safe(stats?.[dataKey], "lost")}</span>
        </div>
      </div>
    </div>
  );

  const renderMessageCard = () => (
    <div className="single-agent-card modern-agent-card social-messages">
      <div className="single-agent-head">
        <TbMail fontSize={22} />
        <span>Social & Email Messages</span>
      </div>
      <div className="single-agent-stats-row icon-badge-row">
        <div className="icon-badge">
          <FaWhatsapp fontSize={24} className="whatsapp-icon" />
          <span className="badge whatsapp-color">{safe(stats?.whatsapp, "total")}</span>
        </div>
        <div className="icon-badge">
          <FaInstagram fontSize={24} className="instagram-icon" />
          <span className="badge instagram-color">{safe(stats?.instagram, "total")}</span>
        </div>
        <div className="icon-badge">
          <FaXTwitter fontSize={24} className="twitter-icon" />
          <span className="badge twitter-color">{safe(stats?.twitter, "total")}</span>
        </div>
        <div className="icon-badge">
          <TbMail fontSize={24} className="email-icon" />
          <span className="badge email-color">{safe(stats?.email, "total")}</span>
        </div>
      </div>
      <div className="single-agent-stats-row placeholder-row">
        <div className="stat-block"></div>
        <div className="stat-block"></div>
      </div>
    </div>
  );

  const renderVoicemailCard = () => {
    const agentId = localStorage.getItem("extension");
    const filteredNotes = Array.isArray(voiceNotes)
      ? voiceNotes.filter((n) => {
          const noteAgent = getNoteAgentId(n);
          return agentId ? String(noteAgent) === String(agentId) : true;
        })
      : [];

    const total = filteredNotes.length;
    const played = filteredNotes.reduce((acc, n) => acc + (isVoiceNotePlayed(n) ? 1 : 0), 0);
    const notPlayed = Math.max(total - played, 0);

    return (
      <div className="single-agent-card modern-agent-card voicemail">
        <div className="single-agent-head">
          <TbMail fontSize={22} />
          <span>Voicemail Calls</span>
        </div>
        <div className="single-agent-stats-row cols-3">
          <div className="stat-block">
            <span className="stat-label">Total</span>
            <span className="stat-value voicemail-color">{total}</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">played</span>
            <span className="stat-value answered-color">{played}</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">not played</span>
            <span className="stat-value lost-color">{notPlayed}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-single-agent modern-agent-dashboard">
      {loading ? (
        <div className="loading-wrapper">
          <CircularProgress />
        </div>
      ) : (
        <>
          {/* Keep Inbound, Outbound, and Voicemail as-is */}
          {renderCard("inbound", FiPhoneIncoming, "In-Bound Calls", "inbound", "inbound")}
          {renderCard("outbound", HiPhoneOutgoing, "Out-Bound Calls", "outbound", "outbound")}
          {renderMessageCard()}
          {renderVoicemailCard()}
        </>
      )}
    </div>
  );
}
