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

  // Rows for the table
  const metrics = [
    { key: 'aht', title: 'Average Handling Time (AHT)', icon: <MdOutlineTimer /> },
    { key: 'frt', title: 'First Response Time (FRT)', icon: <MdOutlineSpeed /> },
    { key: 'fcr', title: 'First Call Resolution (FCR)', icon: <MdOutlineCheckCircle /> },
    { key: 'asa', title: 'Average Speed of Answer (ASA)', icon: <MdOutlineSpeed /> },
    { key: 'avar', title: 'Call Abandonment Rate (AVAR)', icon: <MdOutlinePhoneMissed /> },
    { key: 'unanswered', title: 'Unanswered Rate', icon: <MdOutlinePhoneMissed /> },
    { key: 'cs', title: 'Customer Satisfaction (CS)', icon: <MdOutlineSentimentSatisfied /> }
  ];

  return (
    <div className="performance-score">
      <div className="performance-score-title">
        <h4>Agent Performance Score Card</h4>
        <span className="agent-name">Agent ID: {localStorage.getItem('extension')}</span>
      </div>

      <div className="performance-table-container">
        <table className="performance-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Your Score</th>
              <th>Team Average</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, title, icon }) => (
              <tr key={key}>
                <td>
                  <div className="metric-cell">
                    <div className="metric-icon">{icon}</div>
                    <span className="metric-title">{title}</span>
                  </div>
                </td>
                <td className="value-individual">{individualData[key]}</td>
                <td className="value-team">{teamData[key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentPerformanceScore; 