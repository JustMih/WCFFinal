import React, { useState, useEffect } from "react";
import { BsClockHistory } from "react-icons/bs";
import { LuClock2, LuClock12, LuClockAlert } from "react-icons/lu";
import { Bar, Pie } from "react-chartjs-2";
import { baseURL } from "../../../../config";
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
  // State variables to store data from the API
  const [totalCounts, setTotalCounts] = useState([]);
  const [monthlyCounts, setMonthlyCounts] = useState([]);
  const [weeklyCounts, setWeeklyCounts] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  // Fetch data from the API
  const fetchData = async () => {
    try {
      const response = await fetch(
        `${baseURL}/calls/calls-count`
      );
      const data = await response.json();
      setTotalCounts(data.totalCounts);
      setMonthlyCounts(data.monthlyCounts);
      setWeeklyCounts(data.weeklyCounts);
      setDailyCounts(data.dailyCounts);
      setTotalRows(data.totalRows);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Fetch data every 10 seconds to keep it updated in real time
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []);

  // Bar chart data
  const barData = {
    labels: ["Answered", "Busy", "No Answer"],
    datasets: [
      {
        label: "Call Counts",
        data: [
          totalCounts.find((item) => item.disposition === "ANSWERED")?.count ||
            0,
          totalCounts.find((item) => item.disposition === "BUSY")?.count || 0,
          totalCounts.find((item) => item.disposition === "NO ANSWER")?.count ||
            0,
        ],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Pie chart data
  const pieData = {
    labels: ["Answered", "Busy", "No Answer"],
    datasets: [
      {
        label: "Call Distribution",
        data: [
          totalCounts.find((item) => item.disposition === "ANSWERED")?.count ||
            0,
          totalCounts.find((item) => item.disposition === "BUSY")?.count || 0,
          totalCounts.find((item) => item.disposition === "NO ANSWER")?.count ||
            0,
        ],
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCD56"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="call-center-agent-container">
      <h3 className="call-center-agent-title">Supervisor Dashboard</h3>
      <div className="call-center-agent-summary">
        {/* Yearly Summary Cards */}
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {totalCounts.find((item) => item.disposition === "ANSWERED")
                  ?.count || 0}
              </p>
            </div>
            <h4>Yearly Answered Calls</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {totalCounts.find((item) => item.disposition === "NO ANSWER")
                  ?.count || 0}
              </p>
            </div>
            <h4>Yearly No Answer Calls</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {totalCounts.find((item) => item.disposition === "BUSY")
                  ?.count || 0}
              </p>
            </div>
            <h4>Yearly Busy Calls</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {monthlyCounts.find((item) => item.disposition === "ANSWERED")
                  ?.count || 0}
              </p>
            </div>
            <h4>Monthly Answered Calls</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {monthlyCounts.find((item) => item.disposition === "NO ANSWER")
                  ?.count || 0}
              </p>
            </div>
            <h4>Monthly No Answer Calls</h4>
          </div>
        </div>
      </div>
      <div className="call-center-agent-summary">
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {monthlyCounts.find((item) => item.disposition === "BUSY")
                  ?.count || 0}
              </p>
            </div>
            <h4>Monthly Busy Calls</h4>
          </div>
        </div>
        {/* Daily Summary Cards */}
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {dailyCounts.find((item) => item.disposition === "ANSWERED")
                  ?.count || 0}
              </p>
            </div>
            <h4>Daily Answered Calls</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {dailyCounts.find((item) => item.disposition === "NO ANSWER")
                  ?.count || 0}
              </p>
            </div>
            <h4>Daily No Answer Calls</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {dailyCounts.find((item) => item.disposition === "BUSY")
                  ?.count || 0}
              </p>
            </div>
            <h4>Daily Busy Calls</h4>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h4>Call Counts by Disposition</h4>
          <Bar data={barData} options={{ responsive: true }} />
        </div>
        <div className="chart-card">
          <h4>Call Distribution</h4>
          <Pie data={pieData} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
}
