import React, { useEffect, useState } from 'react';
import { baseURL } from "../../config";
import {
  MdOutlineSpeed,
  MdOutlineTimer,
  MdOutlineCheckCircle,
  MdOutlinePhoneMissed,
  MdOutlineSentimentSatisfied
} from 'react-icons/md';
import './AgentPerformanceScore.css';

const AgentPerformanceScore = () => {
  const [individualData, setIndividualData] = useState({});
  const [teamData, setTeamData] = useState({});
  const [error, setError] = useState(null);
  const agentId = localStorage.getItem('extension');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // Fetch Individual Agent Metrics
        const indivRes = await fetch(`${baseURL}/performance/${agentId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!indivRes.ok) throw new Error(`Agent fetch failed: ${indivRes.status}`);
        const indivJson = await indivRes.json();
        const perf = indivJson.data?.performanceMetrics || {};

        setIndividualData({
          aht: perf.aht,
          frt: perf.frt,
          fcr: perf.fcr,
          asa: 0,
          avar: perf.abandonedCalls,
          unanswered: perf.unansweredCalls,
          cs: perf.csat
        });

        // Fetch Team Summary Metrics
        const teamRes = await fetch(`${baseURL}/performance/team/summary`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!teamRes.ok) throw new Error(`Team fetch failed: ${teamRes.status}`);
        const teamJson = await teamRes.json();
        const team = teamJson.data?.teamMetrics || {};

        setTeamData({
          aht: team.avgHandlingTime,
          frt: team.avgResponseTime,
          fcr: team.avgResolutionRate,
          asa: 0,
          avar: team.abandonedCalls,
          unanswered: team.unansweredCalls,
          cs: team.avgSatisfaction
        });

      } catch (err) {
        console.error("Failed to fetch performance data:", err);
        setError(err.message);
      }
    };

    if (agentId) {
      fetchPerformanceData();
    }
  }, [agentId]);

  const renderMetricCard = (icon, title, individualValue, teamValue) => (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-info">
        <h5>{title}</h5>
        <div className="metric-values">
          <div className="individual-value">
            <span className="label">Your Score:</span>
            <span className="value">{individualValue ?? 'Loading...'}</span>
          </div>
          <div className="team-value">
            <span className="label">Team Average:</span>
            <span className="value">{teamValue ?? 'Loading...'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="performance-score">
      <div className="performance-score-title">
        <h4>Agent Performance Score Card</h4>
        <span className="agent-name">Agent ID: {agentId}</span>
        {error && <div className="error-message">Error: {error}</div>}
      </div>
      <div className="performance-metrics">
        {renderMetricCard(<MdOutlineTimer />, "Average Handling Time (AHT)", individualData.aht, teamData.aht)}
        {renderMetricCard(<MdOutlineSpeed />, "First Response Time (FRT)", individualData.frt, teamData.frt)}
        {renderMetricCard(<MdOutlineCheckCircle />, "First Call Resolution (FCR)", individualData.fcr, teamData.fcr)}
        {renderMetricCard(<MdOutlineSpeed />, "Average Speed of Answer (ASA)", individualData.asa, teamData.asa)}
        {renderMetricCard(<MdOutlinePhoneMissed />, "Call Abandonment Rate (AVAR)", individualData.avar, teamData.avar)}
        {renderMetricCard(<MdOutlinePhoneMissed />, "Unanswered Rate", individualData.unanswered, teamData.unanswered)}
        {renderMetricCard(<MdOutlineSentimentSatisfied />, "Customer Satisfaction (CS)", individualData.cs, teamData.cs)}
      </div>
    </div>
  );
};

export default AgentPerformanceScore;
