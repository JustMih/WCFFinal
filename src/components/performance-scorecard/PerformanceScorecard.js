import React, { useState, useEffect } from "react";
import {
  MdOutlineSpeed,
  MdOutlineTimer,
  MdOutlineCheckCircle,
  MdOutlineSentimentSatisfied,
  MdPhonePaused,
} from "react-icons/md";
import { baseURL } from "../../config";
import "./PerformanceScorecard.css";

const PerformanceScorecard = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewMode, setViewMode] = useState("team");
  const [agentsList, setAgentsList] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    aht: "0:00",
    frt: "0:00",
    fcr: "0%",
    asa: "0:00",
    avar: "0%",
    unansweredRate: "0%",
    csat: "0%",
  });

  useEffect(() => {
    fetchAgentsList();
  }, []);

  useEffect(() => {
    if (viewMode === "team" || (viewMode === "agent" && selectedAgent)) {
      fetchPerformanceMetrics();
    } else if (viewMode === "agent" && !selectedAgent) {
      // Reset to default when no agent is selected
      setPerformanceMetrics({
        aht: "0:00",
        frt: "0:00",
        fcr: "0%",
        asa: "0:00",
        avar: "0%",
        unansweredRate: "0%",
        csat: "0%",
      });
    }
  }, [selectedAgent, viewMode]);

  const fetchAgentsList = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setAgentsList(data.agents || []);
    } catch (error) {
      console.log("Error fetching agents list", error);
    }
  };

  // Helper function to format time from seconds to MM:SS
  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to format percentage
  const formatPercentage = (value) => {
    if (!value && value !== 0) return "0%";
    return `${parseFloat(value).toFixed(1)}%`;
  };

  const fetchPerformanceMetrics = async () => {
    try {
      let endpoint;
      if (viewMode === "team") {
        endpoint = `${baseURL}/performance/team/summary`;
      } else {
        // Agent view - need agent ID
        if (!selectedAgent) {
          console.log("No agent selected");
          return;
        }
        endpoint = `${baseURL}/performance/${selectedAgent}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract metrics based on response structure
      let metrics = {
        aht: "0:00",
        frt: "0:00",
        fcr: "0%",
        asa: "0:00",
        avar: "0%",
        unansweredRate: "0%",
        csat: "0%",
      };

      if (viewMode === "team") {
        // Team view response structure
        if (data.data && data.data.teamMetrics) {
          const team = data.data.teamMetrics;
          const totalCalls = team.totalTeamCalls || 0;
          const abandonedCalls = team.abandonedCalls || 0;
          const unansweredCalls = team.unansweredCalls || 0;

          // Calculate abandonment rate
          const avar = totalCalls > 0 ? (abandonedCalls / totalCalls) * 100 : 0;

          // Calculate unanswered rate
          const unansweredRate =
            totalCalls > 0 ? (unansweredCalls / totalCalls) * 100 : 0;

          // Use avgResponseTime as ASA if available
          const asa = team.avgResponseTime || 0;

          metrics = {
            aht: formatTime(team.avgHandlingTime || 0),
            frt: formatTime(team.avgResponseTime || 0),
            fcr: formatPercentage(team.avgResolutionRate || 0),
            asa: formatTime(asa),
            avar: formatPercentage(avar),
            unansweredRate: formatPercentage(unansweredRate),
            csat: formatPercentage(team.avgSatisfaction || 0),
          };
        }
      } else {
        // Agent view response structure
        if (data.data && data.data.performanceMetrics) {
          const perf = data.data.performanceMetrics;
          const totalCalls = perf.totalCalls || 0;
          const unansweredCalls = perf.unansweredCalls || 0;
          const abandonedCalls = perf.abandonedCalls || 0;

          // Calculate ASA (Average Speed of Answer) - using FRT as proxy if not available
          const asa = perf.asa || perf.frt || 0;

          // Calculate abandonment rate
          const avar = totalCalls > 0 ? (abandonedCalls / totalCalls) * 100 : 0;

          // Calculate unanswered rate
          const unansweredRate =
            totalCalls > 0 ? (unansweredCalls / totalCalls) * 100 : 0;

          metrics = {
            aht: formatTime(perf.aht || 0),
            frt: formatTime(perf.frt || 0),
            fcr: formatPercentage(perf.fcr || 0),
            asa: formatTime(asa),
            avar: formatPercentage(avar),
            unansweredRate: formatPercentage(unansweredRate),
            csat: formatPercentage(perf.csat || 0),
          };
        }
      }

      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics", error);
      // Reset to default on error
      setPerformanceMetrics({
        aht: "0:00",
        frt: "0:00",
        fcr: "0%",
        asa: "0:00",
        avar: "0%",
        unansweredRate: "0%",
        csat: "0%",
      });
    }
  };

  const exportPerformanceReport = () => {
    // TODO: Implement report export functionality
    console.log("Exporting performance report...");
  };

  return (
    <div className="performance-scorecard">
      <div className="performance-scorecard-header">
        <h3 className="performance-scorecard-title">Performance Scorecard</h3>
        <div className="performance-controls">
          <div className="view-toggle">
            <button
              className={`toggle-button ${viewMode === "team" ? "active" : ""}`}
              onClick={() => setViewMode("team")}
            >
              Team View
            </button>
            <button
              className={`toggle-button ${
                viewMode === "agent" ? "active" : ""
              }`}
              onClick={() => setViewMode("agent")}
            >
              Agent View
            </button>
          </div>
          {viewMode === "agent" && (
            <select
              className="agent-select"
              value={selectedAgent || ""}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Select Agent</option>
              {agentsList.map((agent) => (
                <option key={agent.id} value={agent.extension || agent.id}>
                  {agent.full_name} - {agent.extension || "N/A"}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="performance-metrics-grid">
        <div className="performance-metric-card">
          <div className="metric-icon">
            <MdOutlineTimer />
          </div>
          <div className="metric-info">
            <h4>Average Handling Time (AHT)</h4>
            <p>{performanceMetrics.aht}</p>
          </div>
        </div>

        <div className="performance-metric-card">
          <div className="metric-icon">
            <MdOutlineSpeed />
          </div>
          <div className="metric-info">
            <h4>First Response Time (FRT)</h4>
            <p>{performanceMetrics.frt}</p>
          </div>
        </div>

        <div className="performance-metric-card">
          <div className="metric-icon">
            <MdOutlineCheckCircle />
          </div>
          <div className="metric-info">
            <h4>First Call Resolution (FCR)</h4>
            <p>{performanceMetrics.fcr}</p>
          </div>
        </div>

        <div className="performance-metric-card">
          <div className="metric-icon">
            <MdOutlineSpeed />
          </div>
          <div className="metric-info">
            <h4>Average Speed of Answer (ASA)</h4>
            <p>{performanceMetrics.asa}</p>
          </div>
        </div>

        <div className="performance-metric-card">
          <div className="metric-icon">
            <MdPhonePaused />
          </div>
          <div className="metric-info">
            <h4>Call Abandonment Rate</h4>
            <p>{performanceMetrics.avar}</p>
          </div>
        </div>

        <div className="performance-metric-card">
          <div className="metric-icon">
            <MdPhonePaused />
          </div>
          <div className="metric-info">
            <h4>Unanswered Rate</h4>
            <p>{performanceMetrics.unansweredRate}</p>
          </div>
        </div>

        <div className="performance-metric-card">
          <div className="metric-icon">
            <MdOutlineSentimentSatisfied />
          </div>
          <div className="metric-info">
            <h4>Customer Satisfaction (CSAT)</h4>
            <p>{performanceMetrics.csat}</p>
          </div>
        </div>
      </div>

      <div className="performance-actions">
        <button className="export-button" onClick={exportPerformanceReport}>
          Export Report
        </button>
      </div>
    </div>
  );
};

export default PerformanceScorecard;
