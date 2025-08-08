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

  const safe = (obj, key, fallback = 0) => (obj && obj[key] != null ? obj[key] : fallback);

  // Calculate total contacts for each type
  const getContactTotals = () => {
    if (!contactData) {
      // Return dummy data when no real data is available
      return {
        inbound: 25,
        outbound: 18,
        voicemail: 8,
        social: 15, // Combined social messages
      };
    }

    // Calculate social messages (WhatsApp + Instagram + Twitter + Email)
    const socialTotal = 
      safe(contactData?.whatsapp, "total", 0) +
      safe(contactData?.instagram, "total", 0) +
      safe(contactData?.twitter, "total", 0) +
      safe(contactData?.email, "total", 0);

    return {
      inbound: safe(contactData?.inbound, "total", 0),
      outbound: safe(contactData?.outbound, "total", 0),
      voicemail: safe(contactData?.voicemail, "total", 0),
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
          "#3B82F6", // Blue for inbound
          "#10B981", // Green for outbound
          "#E5E7EB", // Background-matching color for voicemail
          "#8B5CF6"  // Purple for social
        ],
        borderColor: [
          "#2563EB",
          "#059669", 
          "#E5E7EB",
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
      color: "#3B82F6",
      description: "Incoming customer calls"
    },
    {
      icon: HiPhoneOutgoing,
      title: "Outbound Calls", 
      count: contactTotals.outbound,
      color: "#10B981",
      description: "Outgoing agent calls"
    },
    {
      icon: TbPhoneX,
      title: "Voicemail",
      count: contactTotals.voicemail,
      color: "#94A3B8",
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