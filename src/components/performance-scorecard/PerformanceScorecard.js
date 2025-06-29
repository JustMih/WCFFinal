import React, { useState, useEffect } from 'react';
import { MdOutlineSpeed, MdOutlineTimer, MdOutlineCheckCircle, MdOutlineSentimentSatisfied, MdPhonePaused } from "react-icons/md";
import { baseURL } from '../../config';
import './PerformanceScorecard.css';

const PerformanceScorecard = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewMode, setViewMode] = useState('team');
  const [agentsList, setAgentsList] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    aht: "0:00",
    frt: "0:00",
    fcr: "0%",
    asa: "0:00",
    avar: "0%",
    unansweredRate: "0%",
    csat: "0%"
  });

  useEffect(() => {
    fetchAgentsList();
    fetchPerformanceMetrics();
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

  const fetchPerformanceMetrics = async () => {
    try {
      const endpoint = viewMode === 'team' 
        ? '/users/team-performance'
        : `/users/agent-performance/${selectedAgent}`;
      
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setPerformanceMetrics(data);
    } catch (error) {
      console.log("Error fetching performance metrics", error);
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
              className={`toggle-button ${viewMode === 'team' ? 'active' : ''}`}
              onClick={() => setViewMode('team')}
            >
              Team View
            </button>
            <button 
              className={`toggle-button ${viewMode === 'agent' ? 'active' : ''}`}
              onClick={() => setViewMode('agent')}
            >
              Agent View
            </button>
          </div>
          {viewMode === 'agent' && (
            <select 
              className="agent-select"
              value={selectedAgent || ''}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Select Agent</option>
              {agentsList.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
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