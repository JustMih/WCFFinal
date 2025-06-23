import React, { useEffect, useState } from "react";
import { FiPhoneIncoming } from "react-icons/fi";
import { TbPhoneCheck, TbPhoneX } from "react-icons/tb";
import { HiPhoneOutgoing, HiOutlineMailOpen } from "react-icons/hi";
import { BsCollection } from "react-icons/bs";
import { RiMailUnreadLine } from "react-icons/ri";
import { IoLogoWhatsapp } from "react-icons/io";
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
    <div className="dashboard-single-agent">
      {loading ? (
        <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 120 }}>
          <CircularProgress />
        </div>
      ) : (
        <>
          <div className="single-agent-card">
            <div className="single-agent-head">
              <FiPhoneIncoming fontSize={15} />
              In-Bound Calls
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <FiPhoneIncoming fontSize={15} color="green" />
                Calls
              </div>
              {safe(stats && stats.inbound, "total")}
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <TbPhoneCheck fontSize={15} />
                Answered
              </div>
              {safe(stats && stats.inbound, "answered")}
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <TbPhoneX fontSize={15} color="red" />
                Dropped
              </div>
              {safe(stats && stats.inbound, "dropped")}
            </div>
          </div>
          <div className="single-agent-card">
            <div className="single-agent-head">
              <HiPhoneOutgoing fontSize={15} />
              Out-Bound Calls
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <FiPhoneIncoming fontSize={15} color="green" />
                Calls
              </div>
              {safe(stats && stats.outbound, "total")}
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <TbPhoneCheck fontSize={15} />
                Answered
              </div>
              {safe(stats && stats.outbound, "answered")}
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <TbPhoneX fontSize={15} color="red" />
                Dropped
              </div>
              {safe(stats && stats.outbound, "dropped")}
            </div>
          </div>
          <div className="single-agent-card">
            <div className="single-agent-head">
              <HiOutlineMailOpen fontSize={15} />
              Emails
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <BsCollection fontSize={15} color="green" />
                Total
              </div>
              0
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <HiOutlineMailOpen fontSize={15} />
                Opened
              </div>
              0
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <RiMailUnreadLine fontSize={15} color="red" />
                Closed
              </div>
              0
            </div>
          </div>
          <div className="single-agent-card">
            <div className="single-agent-head">
              <IoLogoWhatsapp fontSize={15} color="green" />
              Whatsapp
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <BsCollection fontSize={15} color="green" />
                Total
              </div>
              0
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <HiOutlineMailOpen fontSize={15} />
                Opened
              </div>
              0
            </div>
            <div className="single-agent-level">
              <div className="single-agent-level-left">
                <RiMailUnreadLine fontSize={15} color="red" />
                Closed
              </div>
              0
            </div>
          </div>
        </>
      )}
    </div>
  );
} 