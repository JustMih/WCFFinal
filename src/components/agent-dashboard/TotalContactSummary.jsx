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
import CircularProgress from "@mui/material/CircularProgress";
import "./TotalContactSummary.css";
import { baseURL } from "../../config";

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const toInt = (value) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
};

const sumDirectionTotal = (dir) => {
  if (dir?.total != null) return toInt(dir.total);
  return toInt(dir?.answered) + toInt(dir?.dropped) + toInt(dir?.lost);
};

export default function TotalContactSummary() {
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const agentId = localStorage.getItem("extension");
    const userId = localStorage.getItem("userId");
    if (!agentId) {
      setContactData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const query = new URLSearchParams({ excludeDestS: "1" });
    if (userId) query.set("userId", userId);
    fetch(`${baseURL}/calls/agent-calls-today/${agentId}?${query}`)
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

<<<<<<< HEAD
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
        const userId = localStorage.getItem("userId");
        const extension = localStorage.getItem("extension");
        const notes = (data.voiceNotes || []).filter((note) => {
          if (!userId) return false;
          if (String(note.assigned_agent_id) === String(userId)) return true;
          return (
            (note.assigned_agent_id == null || note.assigned_agent_id === "") &&
            extension &&
            String(note.assigned_extension) === String(extension)
          );
        });
        setVoicemailCount(notes.length);
      } catch (error) {
        setVoicemailCount(0);
      }
    };
    fetchVoiceNotes();
    const handleStorage = (e) => {
      if (e.key === "playedVoiceNotes") fetchVoiceNotes();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

=======
>>>>>>> def186fb58df8a71fb7b331492dac6d1cdd89e4b
  const safe = (obj, key, fallback = 0) =>
    toInt(obj && obj[key] != null ? obj[key] : fallback);

  const getContactTotals = () => {
    const inboundTotal = sumDirectionTotal(contactData?.inbound);
    const outboundTotal = sumDirectionTotal(contactData?.outbound);

    const socialTotal = contactData
      ? safe(contactData?.whatsapp, "total", 0) +
        safe(contactData?.instagram, "total", 0) +
        safe(contactData?.twitter, "total", 0) +
        safe(contactData?.email, "total", 0)
      : 0;

    return {
      inbound: inboundTotal,
      outbound: outboundTotal,
      voicemail: safe(contactData?.voicemail, "total", 0),
      social: socialTotal,
    };
  };

  const contactTotals = getContactTotals();
  const totalContacts = Object.values(contactTotals).reduce(
    (sum, val) => sum + toInt(val),
    0
  );

  const chartData = {
    labels: [
      "Inbound Calls",
      "Outbound Calls",
      "Voicemail",
      "Social Messages",
    ],
    datasets: [
      {
        data: [
          contactTotals.inbound,
          contactTotals.outbound,
          contactTotals.voicemail,
          contactTotals.social,
        ],
        backgroundColor: ["#60A5FA", "#34D399", "#FCD34D", "#8B5CF6"],
        borderColor: ["#3B82F6", "#10B981", "#FBBF24", "#7C3AED"],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
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
              totalContacts > 0
                ? ((value / totalContacts) * 100).toFixed(1)
                : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
      },
    },
  };

  const contactItems = [
    {
      icon: FiPhoneIncoming,
      title: "Inbound Calls",
      count: contactTotals.inbound,
      color: "#60A5FA",
      description: "Incoming customer calls",
    },
    {
      icon: HiPhoneOutgoing,
      title: "Outbound Calls",
      count: contactTotals.outbound,
      color: "#34D399",
      description: "Outgoing agent calls",
    },
    {
      icon: TbPhoneX,
      title: "Voicemail",
      count: contactTotals.voicemail,
      color: "#FCD34D",
      description: "Voicemail messages",
    },
    {
      icon: TbMail,
      title: "Social Messages",
      count: contactTotals.social,
      color: "#8B5CF6",
      description: "WhatsApp, Email, Social media",
    },
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
                  <div
                    className="contact-item-icon"
                    style={{ color: item.color }}
                  >
                    <item.icon size={20} />
                  </div>
                  <div className="contact-item-details">
                    <div className="contact-item-title">{item.title}</div>
                    <div className="contact-item-count">{item.count}</div>
                    <div className="contact-item-description">
                      {item.description}
                    </div>
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
