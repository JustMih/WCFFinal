import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { FiPhoneIncoming } from "react-icons/fi";
import { HiPhoneOutgoing } from "react-icons/hi";
import { TbPhoneX, TbMail } from "react-icons/tb";
import { FaWhatsapp, FaInstagram, FaXTwitter } from "react-icons/fa6";
import CircularProgress from "@mui/material/CircularProgress";
import "./TotalContactSummary.css";
import { baseURL } from "../../config";

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement);

export default function TotalContactSummary() {
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

  // Voicemail count from voice-notes API (same pattern as AgentsDashboard VoiceNotesReport)
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

  // Calculate total contacts for each type (voicemail from voice-notes API, same as VoiceNotesReport)
  const getContactTotals = () => {
    if (!contactData) {
      return {
        inbound: 25,
        outbound: 18,
        voicemail: voicemailCount,
        social: 15,
      };
    }

    const socialTotal =
      safe(contactData?.whatsapp, "total", 0) +
      safe(contactData?.instagram, "total", 0) +
      safe(contactData?.twitter, "total", 0) +
      safe(contactData?.email, "total", 0);

    return {
      inbound: safe(contactData?.inbound, "total", 0),
      outbound: safe(contactData?.outbound, "total", 0),
      voicemail: voicemailCount,
      social: socialTotal,
    };
  };

  const contactTotals = getContactTotals();
  const totalContacts = Object.values(contactTotals).reduce((sum, val) => sum + val, 0);

  // Prepare chart data
  const chartData = {
    labels: [
      "Inbound Calls",
      "Outbound Calls", 
      "Voicemail",
      "Social Messages"
    ],
    datasets: [
      {
        data: [
          contactTotals.inbound,
          contactTotals.outbound,
          contactTotals.voicemail,
          contactTotals.social
        ],
        backgroundColor: [
          "#60A5FA", // Pale blue for inbound
          "#34D399", // Pale green for outbound
          "#FCD34D", // Pale yellow for voicemail
          "#8B5CF6"  // Purple for social
        ],
        borderColor: [
          "#3B82F6",
          "#10B981",
          "#FBBF24", // Pale yellow border for voicemail
          "#7C3AED"
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        position: "bottom",
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 10,
            weight: "bold"
          },
          boxWidth: 8,
          boxHeight: 8
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || "";
            const value = context.parsed;
            const percentage = totalContacts > 0 ? ((value / totalContacts) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        },
        titleFont: {
          size: 12
        },
        bodyFont: {
          size: 11
        }
      }
    }
  };

  const contactItems = [
    {
      icon: FiPhoneIncoming,
      title: "Inbound Calls",
      count: contactTotals.inbound,
      color: "#60A5FA",
      description: "Incoming customer calls"
    },
    {
      icon: HiPhoneOutgoing,
      title: "Outbound Calls", 
      count: contactTotals.outbound,
      color: "#34D399",
      description: "Outgoing agent calls"
    },
    {
      icon: TbPhoneX,
      title: "Voicemail",
      count: contactTotals.voicemail,
      color: "#FCD34D",
      description: "Voicemail messages"
    },
    {
      icon: TbMail,
      title: "Social Messages",
      count: contactTotals.social,
      color: "#8B5CF6",
      description: "WhatsApp, Email, Social media"
    }
  ];

  return (
    <div className="total-contact-summary-card">
      <div className="contact-summary-header">
        <h3>Total Contact Summary</h3>
        <div className="total-contacts-badge">
          <span className="total-number">{totalContacts}</span>
          <span className="total-label">Total Contacts</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-wrapper">
          <CircularProgress />
        </div>
      ) : (
        <div className="contact-summary-content">
          <div className="chart-section">
            <div className="pie-chart-container">
              <Pie data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="contact-breakdown">
            <div className="contact-items">
              {contactItems.map((item, index) => (
                <div key={index} className="contact-item">
                  <div className="contact-item-icon" style={{ color: item.color }}>
                    <item.icon size={20} />
                  </div>
                  <div className="contact-item-details">
                    <div className="contact-item-title">{item.title}</div>
                    <div className="contact-item-count">{item.count}</div>
                    <div className="contact-item-description">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 