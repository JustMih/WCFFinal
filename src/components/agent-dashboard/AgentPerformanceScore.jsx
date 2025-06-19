import React from 'react';
import { MdOutlineSpeed, MdOutlineTimer, MdOutlineCheckCircle, MdOutlinePhoneMissed, MdOutlineSentimentSatisfied } from 'react-icons/md';
import './AgentPerformanceScore.css';

const AgentPerformanceScore = () => {
  // Dummy data for individual agent performance metrics
  const individualData = {
    aht: "3:45", // Average handling time
    frt: "0:15", // First response time
    fcr: "85%", // First call resolution
    asa: "0:20", // Average speed of answer
    avar: "5%", // Average call abandonment rate
    unanswered: "3%", // Unanswered rate
    cs: "92%" // Customer satisfaction
  };

  // Dummy data for team averages
  const teamData = {
    aht: "4:15",
    frt: "0:25",
    fcr: "78%",
    asa: "0:30",
    avar: "7%",
    unanswered: "4%",
    cs: "88%"
  };
 
  const renderMetricCard = (icon, title, individualValue, teamValue) => (
    <div className="metric-card">
      <div className="metric-icon">
        {icon}
      </div>
      <div className="metric-info">
        <h5>{title}</h5>
        <div className="metric-values">
          <div className="individual-value">
            <span className="label">Your Score:</span>
            <span className="value">{individualValue}</span>
          </div>
          <div className="team-value">
            <span className="label">Team Average:</span>
            <span className="value">{teamValue}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="performance-score">
      <div className="performance-score-title">
        <h4>Agent Performance Score Card</h4>
        <span className="agent-name">Agent ID: {localStorage.getItem('extension')}</span>
      </div>
      <div className="performance-metrics">
        {renderMetricCard(
          <MdOutlineTimer />,
          "Average Handling Time (AHT)",
          individualData.aht,
          teamData.aht
        )}

        {renderMetricCard(
          <MdOutlineSpeed />,
          "First Response Time (FRT)",
          individualData.frt,
          teamData.frt
        )}

        {renderMetricCard(
          <MdOutlineCheckCircle />,
          "First Call Resolution (FCR)",
          individualData.fcr,
          teamData.fcr
        )}

        {renderMetricCard(
          <MdOutlineSpeed />,
          "Average Speed of Answer (ASA)",
          individualData.asa,
          teamData.asa
        )}

        {renderMetricCard(
          <MdOutlinePhoneMissed />,
          "Call Abandonment Rate (AVAR)",
          individualData.avar,
          teamData.avar
        )}

        {renderMetricCard(
          <MdOutlinePhoneMissed />,
          "Unanswered Rate",
          individualData.unanswered,
          teamData.unanswered
        )}

        {renderMetricCard(
          <MdOutlineSentimentSatisfied />,
          "Customer Satisfaction (CS)",
          individualData.cs,
          teamData.cs
        )}
      </div>
    </div>
  );
};

export default AgentPerformanceScore; 