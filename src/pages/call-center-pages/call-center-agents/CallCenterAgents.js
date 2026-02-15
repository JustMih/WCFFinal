import React, { useEffect, useState } from "react";
import { MdOutlineSupportAgent, MdPhonePaused, MdOutlineSpeed, MdOutlineTimer, MdOutlineCheckCircle, MdOutlineSentimentSatisfied } from "react-icons/md";
import { CiLogin, CiLogout } from "react-icons/ci";
import { BiSolidLeftDownArrowCircle } from "react-icons/bi";
import { VscVmActive } from "react-icons/vsc";
import { AiOutlinePauseCircle } from "react-icons/ai";
import { SiTransmission } from "react-icons/si";
import { baseURL } from "../../../config";
import PerformanceScorecard from "../../../components/performance-scorecard/PerformanceScorecard";
import "./callCenterAgents.css";

export default function CallCenterAgent() {
  const [totalAgents, setTotalAgents] = useState(null);
  const [onlineCountAgents, setCountOnlineAgents] = useState(null);
  const [offlineCountAgents, setOfflineCountAgents] = useState(null);
  const [activeCountAgents, setCountActiveAgents] = useState(null);
  const [idleCountAgents, setIdleCountAgents] = useState(null);
  const [pauseCountAgents, setCountPauseAgents] = useState(null);
  const [forcePauseCountAgents, setForcePauseCountAgents] = useState(null);
  const [missionCountAgents, setCountMissionAgents] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCountCategory, setSelectedCountCategory] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewMode, setViewMode] = useState('team'); // 'team' or 'agent'
  const [agentsList, setAgentsList] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    aht: "0:00", // Average Handling Time
    frt: "0:00", // First Response Time
    fcr: "0%", // First Call Resolution
    asa: "0:00", // Average Speed of Answer
    avar: "0%", // Average Call Abandonment Rate
    unansweredRate: "0%", // Unanswered Rate
    csat: "0%" // Customer Satisfaction
  });

  useEffect(() => {
    agentsCount();
    onlineAgent();
    offlineAgent();
    offlineActive();
    offlinePause();
    offlineIdle();
    offlineForcePause();
    offlineMission();
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

  const fetchAgentsByCategory = async (category) => {
    let endpoint = "";
    switch (category) {
      case "all-agents":
        endpoint = "agents";
        break;
      case "online":
        endpoint = "agents-online";
        break;
      case "offline":
        endpoint = "agents-offline";
        break;
      case "idle":
        endpoint = "agents-idle";
        break;
      case "active":
        endpoint = "agents-active";
        break;
      case "pause":
        endpoint = "agents-pause";
        break;
      case "force-pause":
        endpoint = "agents-force-pause";
        break;
      case "mission":
        endpoint = "agents-mission";
        break;
      default:
        return;
    }
    try {
      const response = await fetch(`${baseURL}/users/${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setSelectedCategory({ name: category, agents: data.agents || [] });
      setSelectedCountCategory(data.agentCount);
    } catch (error) {
      console.log("Error fetching agents", error);
    }
  };

  const agentsCount = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setTotalAgents(data.count);
      // console.log("agents list", data.count);
    } catch (err) {
      console.log("Error fetching agents", err);
    }
  };
  // console.log("total agents", totalAgents);
  const onlineAgent = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents-online`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setCountOnlineAgents(data.agentCount);
    } catch (error) {
      console.log("Error fetching online agents", error);
    }
  };
  const offlineAgent = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents-offline`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setOfflineCountAgents(data.agentCount);
      // console.log("offline agents", data.agentCount);
    } catch (error) {
      console.log("Error fetching offline agents", error);
    }
  };

  const offlineActive = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents-active`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setCountActiveAgents(data.agentCount);
      // console.log("offline agents", data.agentCount);
    } catch (error) {
      console.log("Error fetching offline agents", error);
    }
  };

  const offlinePause = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents-pause`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setCountPauseAgents(data.agentCount);
      // console.log("offline agents", data.agentCount);
    } catch (error) {
      console.log("Error fetching offline agents", error);
    }
  };
  const offlineIdle = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents-idle`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setIdleCountAgents(data.agentCount);
      // console.log("offline agents", data.agentCount);
    } catch (error) {
      console.log("Error fetching offline agents", error);
    }
  };
  const offlineForcePause = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents-force-pause`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setForcePauseCountAgents(data.agentCount);
      // console.log("offline agents", data.agentCount);
    } catch (error) {
      console.log("Error fetching offline agents", error);
    }
  };
  const offlineMission = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents-mission`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      setCountMissionAgents(data.agentCount);
      // console.log("offline agents", data.agentCount);
    } catch (error) {
      console.log("Error fetching offline agents", error);
    }
  };
  return (
    <div className="call-center-agent-container">
      <h3 className="call-center-agent-title">Agents Statistics</h3>
      <div className="call-center-agent-summary">
        <div
          className="call-center-agent-card"
          onClick={() => fetchAgentsByCategory("all-agents")}
        >
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <MdOutlineSupportAgent />
              <p className="call-center-agent-value">{totalAgents}</p>
            </div>
            <h4>Total Agents</h4>
          </div>
        </div>
        <div
          className="call-center-agent-card"
          onClick={() => fetchAgentsByCategory("online")}
        >
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <CiLogin />
              <p className="call-center-agent-value">{onlineCountAgents}</p>
            </div>
            <h4>Logged In</h4>
          </div>
        </div>
        <div
          className="call-center-agent-card"
          onClick={() => fetchAgentsByCategory("offline")}
        >
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <CiLogout />
              <p className="call-center-agent-value">{offlineCountAgents}</p>
            </div>
            <h4>Logged Off</h4>
          </div>
        </div>
        <div
          className="call-center-agent-card"
          onClick={() => fetchAgentsByCategory("idle")}
        >
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <BiSolidLeftDownArrowCircle />
              <p className="call-center-agent-value">{idleCountAgents}</p>
            </div>
            <h4>Idle</h4>
          </div>
        </div>
      </div>
      <div
        className="call-center-agent-summary"
        onClick={() => fetchAgentsByCategory("active")}
      >
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <VscVmActive />
              <p className="call-center-agent-value">{activeCountAgents}</p>
            </div>
            <h4>Active</h4>
          </div>
        </div>
        <div
          className="call-center-agent-card"
          onClick={() => fetchAgentsByCategory("pause")}
        >
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <AiOutlinePauseCircle />
              <p className="call-center-agent-value">{pauseCountAgents}</p>
            </div>
            <h4>Pause</h4>
          </div>
        </div>
        <div
          className="call-center-agent-card"
          onClick={() => fetchAgentsByCategory("force-pause")}
        >
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <MdPhonePaused />
              <p className="call-center-agent-value">{forcePauseCountAgents}</p>
            </div>
            <h4>Force Pause</h4>
          </div>
        </div>
        <div
          className="call-center-agent-card"
          onClick={() => fetchAgentsByCategory("mission")}
        >
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <SiTransmission />
              <p className="call-center-agent-value">{missionCountAgents}</p>
            </div>
            <h4>Mission</h4>
          </div>
        </div>
      </div>

      {selectedCategory && (
        <div className="call-center-agent-table-container">
          <h3>
            {selectedCategory.name} agents: {selectedCountCategory}
          </h3>
          <table className="call-center-agent-table">
            <thead>
              <tr>
                <th>Sn</th>
                <th>Name</th>
                <th>Email</th>
                <th>Extension</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {selectedCategory.agents.map((agent, index) => (
                <tr key={agent.id}>
                  <td>{index + 1}</td>
                  <td>{agent.full_name}</td>
                  <td>{agent.email}</td>
                  <td>{agent.extension}</td>
                  <td>
                    <div
                      style={{
                        backgroundColor:
                          agent.status === "offline" ? "#f2c0bd" : "#d0f2d4",
                        borderRadius: 50,
                        color: "black",
                        width: "40%",
                        margin: 0,
                        padding: 3,
                        textAlign: "center",
                      }}
                    >
                      {agent.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

       {/* Performance Scorecard Section */}
       <PerformanceScorecard />
    </div>
  );
}

const exportPerformanceReport = () => {
  // TODO: Implement report export functionality
  console.log("Exporting performance report...");
};
