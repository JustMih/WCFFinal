import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from "chart.js";
import { FiPhoneIncoming } from "react-icons/fi";
import { HiPhoneOutgoing } from "react-icons/hi";
import { TbPhoneX, TbMail } from "react-icons/tb";
import CircularProgress from "@mui/material/CircularProgress";
import "./ContactSummaryGrid.css";
import { baseURL } from "../../config";
import {
  fetchVoiceNotes,
  VOICE_NOTE_PLAYED_EVENT,
  PLAYED_VOICE_NOTES_KEY,
} from "../../utils/voiceNotePlayed";

ChartJS.register(Title, Tooltip, Legend, ArcElement, RadialLinearScale);

const toInt = (value) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
};

const sumDirectionTotal = (dir) =>
  toInt(dir?.answered) + toInt(dir?.dropped) + toInt(dir?.lost);

export default function ContactSummaryGrid() {
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voicemailCount, setVoicemailCount] = useState(0);
  const [unplayedVoicemailCount, setUnplayedVoicemailCount] = useState(0);

  useEffect(() => {
    const agentId = localStorage.getItem("extension");
    if (!agentId) {
      setContactData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${baseURL}/calls/agent-calls-today/${agentId}?excludeDestS=1`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch contact data");
        return res.json();
      })
      .then((data) => {
        setContactData(data);
        setLoading(false);
      })
      .catch(() => {
        setContactData(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const loadVoiceNotes = async () => {
      try {
        const agentId = localStorage.getItem("userId");
        const [allNotes, unplayedNotes] = await Promise.all([
          fetchVoiceNotes({ agentId }),
          fetchVoiceNotes({ agentId, unplayedOnly: true }),
        ]);
        setVoicemailCount(allNotes.length);
        setUnplayedVoicemailCount(unplayedNotes.length);
      } catch (error) {
        setVoicemailCount(0);
        setUnplayedVoicemailCount(0);
      }
    };
    loadVoiceNotes();
    const handleStorage = (e) => {
      if (e.key === PLAYED_VOICE_NOTES_KEY) loadVoiceNotes();
    };
    const handleVoiceNotePlayed = () => loadVoiceNotes();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(VOICE_NOTE_PLAYED_EVENT, handleVoiceNotePlayed);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(VOICE_NOTE_PLAYED_EVENT, handleVoiceNotePlayed);
    };
  }, []);

  const safe = (obj, key, fallback = 0) =>
    toInt(obj && obj[key] != null ? obj[key] : fallback);

  const getData = () => {
    const inbound = contactData?.inbound || {};
    const outbound = contactData?.outbound || {};

    const socialTotal = contactData
      ? safe(contactData?.whatsapp, "total", 0) +
        safe(contactData?.instagram, "total", 0) +
        safe(contactData?.twitter, "total", 0) +
        safe(contactData?.email, "total", 0)
      : 0;

    return {
      inbound: {
        total: sumDirectionTotal(inbound),
        answered: safe(inbound, "answered", 0),
        dropped: safe(inbound, "dropped", 0),
        lost: safe(inbound, "lost", 0),
      },
      outbound: {
        total: sumDirectionTotal(outbound),
        answered: safe(outbound, "answered", 0),
        dropped: safe(outbound, "dropped", 0),
        lost: safe(outbound, "lost", 0),
      },
      social: {
        total: socialTotal,
        whatsapp: safe(contactData?.whatsapp, "total", 0),
        email: safe(contactData?.email, "total", 0),
        instagram: safe(contactData?.instagram, "total", 0),
        twitter: safe(contactData?.twitter, "total", 0),
      },
      voicemail: {
        total: voicemailCount,
      },
    };
  };

  const data = getData();

  const InboundSummary = () => (
    <div className="summary-box inbound-box">
      <div className="summary-header">
        <FiPhoneIncoming size={20} />
        <h4>Inbound Calls</h4>
        <span className="total-count">{data.inbound.total}</span>
      </div>
      <div className="summary-content">
        <div className="status-row">
          <span>Answered</span>
          <span className="count">{data.inbound.answered}</span>
        </div>
        <div className="status-row">
          <span>Dropped</span>
          <span className="count">{data.inbound.dropped}</span>
        </div>
        <div className="status-row">
          <span>Lost</span>
          <span className="count">{data.inbound.lost}</span>
        </div>
      </div>
    </div>
  );

  const OutboundSummary = () => (
    <div className="summary-box outbound-box">
      <div className="summary-header">
        <HiPhoneOutgoing size={20} />
        <h4>Outbound Calls</h4>
        <span className="total-count">{data.outbound.total}</span>
      </div>
      <div className="summary-content">
        <div className="status-row">
          <span>Answered</span>
          <span className="count">{data.outbound.answered}</span>
        </div>
        <div className="status-row">
          <span>Dropped</span>
          <span className="count">{data.outbound.dropped}</span>
        </div>
        <div className="status-row">
          <span>Lost</span>
          <span className="count">{data.outbound.lost}</span>
        </div>
      </div>
    </div>
  );

  const SocialDonutChart = () => {
    const totalSocial = data.social.total;
    const whatsappMessages = data.social.whatsapp;
    const emailMessages = data.social.email;
    const instagramMessages = data.social.instagram;
    const twitterMessages = data.social.twitter;

    const chartData = {
      labels: ["WhatsApp", "Email", "Instagram", "Twitter"],
      datasets: [
        {
          data: [
            whatsappMessages,
            emailMessages,
            instagramMessages,
            twitterMessages,
          ],
          backgroundColor: ["#3B82F6", "#10B981", "#E5E7EB", "#F59E0B"],
          borderColor: ["#2563EB", "#059669", "#D1D5DB", "#D97706"],
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage =
                totalSocial > 0
                  ? ((value / totalSocial) * 100).toFixed(1)
                  : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      cutout: "85%",
    };

    return (
      <div className="summary-box social-box">
        <div className="summary-header">
          <TbMail size={20} />
          <h4>Messages</h4>
          <span className="total-count">{data.social.total}</span>
        </div>
        <div className="chart-container">
          <div className="donut-chart-wrapper">
            <Doughnut data={chartData} options={options} />
            <div className="donut-center-text">
              <div className="center-label">Messages</div>
              <div className="center-value">{totalSocial}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const VoicemailDonutChart = () => {
    const totalVoicemails = data.voicemail.total;
    const playedVoicemails = totalVoicemails - unplayedVoicemailCount;
    const notPlayedVoicemails = unplayedVoicemailCount;

    const chartData = {
      labels: ["Played", "Not Played"],
      datasets: [
        {
          data:
            totalVoicemails > 0
              ? [playedVoicemails, notPlayedVoicemails]
              : [0, 0],
          backgroundColor: ["#3B82F6", "#10B981"],
          borderColor: ["#2563EB", "#059669"],
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage =
                totalVoicemails > 0
                  ? ((value / totalVoicemails) * 100).toFixed(1)
                  : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
      cutout: "90%",
    };

    return (
      <div className="summary-box voicemail-box">
        <div className="summary-header">
          <TbPhoneX size={20} />
          <h4>Voicemail</h4>
          <span className="total-count">{data.voicemail.total}</span>
        </div>
        <div className="chart-container">
          <div className="donut-chart-wrapper">
            <Doughnut data={chartData} options={options} />
            <div className="donut-center-text">
              <div className="center-value">{totalVoicemails}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="contact-summary-grid">
      {loading ? (
        <div className="loading-wrapper">
          <CircularProgress />
        </div>
      ) : (
        <>
          <div className="grid-row">
            <InboundSummary />
            <SocialDonutChart />
          </div>
          <div className="grid-row">
            <VoicemailDonutChart />
            <OutboundSummary />
          </div>
        </>
      )}
    </div>
  );
}
