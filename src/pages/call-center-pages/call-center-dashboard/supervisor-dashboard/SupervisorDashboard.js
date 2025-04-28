import React from "react";
import { BsClockHistory } from "react-icons/bs";
import { LuClock2, LuClock12, LuClockAlert } from "react-icons/lu";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "./supervisorDashboard.css";

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function SupervisorDashboard() {
  // Bar chart data
  const barData = {
    labels: ["Agent 1", "Agent 2", "Agent 3", "Agent 4", "Agent 5"],
    datasets: [
      {
        label: "Talk Time (in seconds)",
        data: [120, 150, 200, 180, 140],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Pie chart data
  const pieData = {
    labels: ["Answered Calls", "Abandoned Calls"],
    datasets: [
      {
        label: "Call Distribution",
        data: [80, 20],
        backgroundColor: ["#36A2EB", "#FF6384"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="call-center-agent-container">
      <h3 className="call-center-agent-title">Supervisor Dashboard</h3>
      <div className="call-center-agent-summary">
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <BsClockHistory />
              <p className="call-center-agent-value">01:46 sec</p>
            </div>
            <h4>Longest Call Waiting</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <LuClock2 />
              <p className="call-center-agent-value">05:46 sec</p>
            </div>
            <h4>Average Talk Time</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <LuClock12 />
              <p className="call-center-agent-value">146</p>
            </div>
            <h4>Total Calls</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <LuClockAlert />
              <p className="call-center-agent-value">20</p>
            </div>
            <h4>Total Abandoned Calls</h4>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h4>Talk Time by Agent</h4>
          <Bar data={barData} options={{ responsive: true }} />
        </div>
        <div className="chart-card">
          <h4>Call Distribution</h4>
          <Pie
            data={pieData}
            options={{
              responsive: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
