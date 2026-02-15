import React, { useState, useEffect } from "react";
import { Pie, Doughnut } from "react-chartjs-2";
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
import { FaWhatsapp, FaInstagram, FaXTwitter } from "react-icons/fa6";
import CircularProgress from "@mui/material/CircularProgress";
import "./ContactSummaryGrid.css";
import { baseURL } from "../../config";

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, RadialLinearScale);

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
    fetch(`${baseURL}/calls/agent-calls-today/${agentId}`)
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

  // Voicemail from voice-notes API (same pattern as AgentsDashboard VoiceNotes)
  useEffect(() => {
    const fetchVoiceNotes = async () => {
      try {
        const agentId = localStorage.getItem("userId");
        const response = await fetch(
          `${baseURL}/voice-notes?agentId=${agentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch voice notes");
        const data = await response.json();
        const notes = data.voiceNotes || [];
        const storedPlayed =
          JSON.parse(localStorage.getItem("playedVoiceNotes")) || {};
        const unplayedCount = notes.filter(
          (note) => !storedPlayed[note.id]
        ).length;
        setVoicemailCount(notes.length);
        setUnplayedVoicemailCount(unplayedCount);
      } catch (error) {
        setVoicemailCount(0);
        setUnplayedVoicemailCount(0);
      }
    };
    fetchVoiceNotes();
    const handleStorage = (e) => {
      if (e.key === "playedVoiceNotes") fetchVoiceNotes();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const safe = (obj, key, fallback = 0) => (obj && obj[key] != null ? obj[key] : fallback);

  // Get data with dummy fallback (voicemail total from voice-notes API, same as AgentsDashboard)
  const getData = () => {
    if (!contactData) {
      return {
        inbound: { total: 25, answered: 20, dropped: 3, lost: 2 },
        outbound: { total: 18, answered: 15, dropped: 2, lost: 1 },
        social: { total: 15, whatsapp: 8, email: 4, instagram: 2, twitter: 1 },
        voicemail: { total: voicemailCount, new: Math.floor(voicemailCount * 0.6), old: Math.floor(voicemailCount * 0.4) }
      };
    }

    const socialTotal =
      safe(contactData?.whatsapp, "total", 0) +
      safe(contactData?.instagram, "total", 0) +
      safe(contactData?.twitter, "total", 0) +
      safe(contactData?.email, "total", 0);

    return {
      inbound: {
        total: safe(contactData?.inbound, "total", 0),
        answered: safe(contactData?.inbound, "answered", 0),
        dropped: safe(contactData?.inbound, "dropped", 0),
        lost: safe(contactData?.inbound, "lost", 0)
      },
      outbound: {
        total: safe(contactData?.outbound, "total", 0),
        answered: safe(contactData?.outbound, "answered", 0),
        dropped: safe(contactData?.outbound, "dropped", 0),
        lost: safe(contactData?.outbound, "lost", 0)
      },
      social: {
        total: socialTotal,
        whatsapp: safe(contactData?.whatsapp, "total", 0),
        email: safe(contactData?.email, "total", 0),
        instagram: safe(contactData?.instagram, "total", 0),
        twitter: safe(contactData?.twitter, "total", 0)
      },
      voicemail: {
        total: voicemailCount,
        new: Math.floor(voicemailCount * 0.6),
        old: Math.floor(voicemailCount * 0.4)
      }
    };
  };

  const data = getData();

  // Inbound Calls Summary Box
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

  // Outbound Calls Summary Box
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

  // Social Messages Donut Chart
  const SocialDonutChart = () => {
    // Calculate social message data
    const totalSocial = data.social.total;
    const whatsappMessages = data.social.whatsapp;
    const emailMessages = data.social.email;
    const instagramMessages = data.social.instagram;
    const twitterMessages = data.social.twitter;

    const chartData = {
      labels: ['WhatsApp', 'Email', 'Instagram', 'Twitter'],
      datasets: [{
        data: [whatsappMessages, emailMessages, instagramMessages, twitterMessages],
        backgroundColor: ['#3B82F6', '#10B981', '#E5E7EB', '#F59E0B'], // Blue, Green, Light Grey, Orange
        borderColor: ['#2563EB', '#059669', '#D1D5DB', '#D97706'],
        borderWidth: 2,
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = totalSocial > 0 ? ((value / totalSocial) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '85%'
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

  // Voicemail Donut Chart (played/unplayed from voice-notes API, same as AgentsDashboard)
  const VoicemailDonutChart = () => {
    const totalVoicemails = data.voicemail.total;
    const playedVoicemails = totalVoicemails - unplayedVoicemailCount;
    const notPlayedVoicemails = unplayedVoicemailCount;

    const chartData = {
      labels: ['Played', 'Not Played'],
      datasets: [{
        data: totalVoicemails > 0 ? [playedVoicemails, notPlayedVoicemails] : [0, 0],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderColor: ['#2563EB', '#059669'],
        borderWidth: 1,
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed;
              const percentage = totalVoicemails > 0 ? ((value / totalVoicemails) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '90%'
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
              {/* <div className="center-label">Total</div> */}
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