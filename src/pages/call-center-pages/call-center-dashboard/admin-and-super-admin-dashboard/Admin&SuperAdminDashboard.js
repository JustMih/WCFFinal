import React, { useEffect, useState } from "react";
import { MdOutlineSupportAgent, MdOutlinePendingActions } from "react-icons/md";
import { Pie, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { baseURL } from "../../../../config";
import "./admin&superAdmin.css";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminAndSuperAdminDashboard() {
  const authToken = localStorage.getItem("authToken");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userCounts, setUserCounts] = useState({
    agents: 0,
    supervisors: 0,
    admins: 0,
    otherUsers: 0,
  });

  const getInActiveUsers = async () => {
    try {
      const response = await fetch(`${baseURL}/users/online-users`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      console.log("Online Users:", data);
      setOnlineUsers(data.onlineUser || []); // Ensure we set an empty array if no users are online
    } catch (error) {
      console.error("Error fetching online users:", error);
      setOnlineUsers([]); // Reset to empty array on error
    }
  };

  // State for recent user activities
  const [recentActivities, setRecentActivities] = useState([
    // Dummy data for now
    { user: "Jane Doe", status: "Online", date: "2024-06-10 09:15" },
    { user: "John Smith", status: "Offline", date: "2024-06-10 09:10" },
    { user: "Alice Lee", status: "Online", date: "2024-06-10 08:55" },
  ]);

  const navigate = useNavigate();

  const fetchAdminSummaryByCategory = async (category) => {
    let endpoint = "";
    switch (category) {
      case "agents":
        endpoint = "agent";
        break;
      case "admin":
        endpoint = "super-admin";
        break;
      case "supervisor":
        endpoint = "supervisor";
        break;
      case "manager":
        endpoint = "manager";
        break;
      case "director-general":
        endpoint = "director-general";
        break;
      case "focal-person":
        endpoint = "focal-person";
        break;
      case "head-of-unit":
        endpoint = "head-of-unit";
        break;
      case "coordinator":
        endpoint = "coordinator";
        break;
      case "attendee":
        endpoint = "attendee";
        break;
      default:
        return;
    }
    try {
      const response = await fetch(
        `${baseURL}/users/users-by-role/${endpoint}`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {}
  };
  const fetchPendingRequests = async () => {
    // Placeholder for fetching pending requests/approvals
    // You can replace this with a real API call later
    try {
      // Example: const response = await fetch(`${baseURL}/pending-requests`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      // const data = await response.json();
      // console.log(data);
      console.log("Fetching pending requests...");
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch user counts for each role
  useEffect(() => {
    getInActiveUsers();
    const fetchCounts = async () => {
      const roles = [
        { key: "agents", endpoint: "agent" },
        { key: "supervisors", endpoint: "supervisor" },
        { key: "admins", endpoint: "super-admin" },
      ];
      const counts = {};
      // Fetch role-based counts
      for (const role of roles) {
        try {
          const response = await fetch(
            `${baseURL}/users/users-by-role/${role.endpoint}`,
            {
              method: "GET",
              headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          const data = await response.json();
          counts[role.key] = Array.isArray(data)
            ? data.length
            : data.count || 0;
        } catch (error) {
          counts[role.key] = 0;
        }
      }
      // Fetch all users
      let totalUsers = 0;
      try {
        const response = await fetch(`${baseURL}/users/`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await response.json();
        totalUsers = Array.isArray(data) ? data.length : data.count || 0;
      } catch (error) {
        totalUsers = 0;
      }
      // Calculate other users
      counts.otherUsers =
        totalUsers -
        (counts.agents || 0) -
        (counts.supervisors || 0) -
        (counts.admins || 0);
      setUserCounts(counts);
    };
    fetchCounts();
  }, [authToken]);

  // Fetch recent activities (status changes)
  useEffect(() => {
    // Uncomment and update this when backend is ready
    // const fetchRecentActivities = async () => {
    //   try {
    //     const response = await fetch(`${baseURL}/users/recent-status-changes`, {
    //       headers: { 'Authorization': `Bearer ${authToken}` },
    //     });
    //     const data = await response.json();
    //     setRecentActivities(data);
    //   } catch (error) {
    //     setRecentActivities([]);
    //   }
    // };
    // fetchRecentActivities();
  }, [authToken]);

  // Pie chart data for user summary
  const userPieData = {
    labels: ["Agents", "Supervisors", "Admins", "Other Users"],
    datasets: [
      {
        label: "User Distribution",
        data: [
          userCounts.agents,
          userCounts.supervisors,
          userCounts.admins,
          userCounts.otherUsers,
        ],
        backgroundColor: [
          "#3b71b7",
          "#8cc63f",
          "#5a8fd4",
          "#939598",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Only show the five most recent activities and filter for allowed statuses
  const allowedStatuses = ["Online", "Offline", "Awaiting Admin"];
  const displayedActivities = recentActivities
    .filter((activity) => allowedStatuses.includes(activity.status))
    .slice(0, 5);

  // Calculate total users
  const totalUsers =
    userCounts.agents +
    userCounts.supervisors +
    userCounts.admins +
    userCounts.otherUsers;

  return (
    <div className="admin-container">
      <h3 className="admin-title">Dashboard</h3>
      <div className="admin-summary">
        <div className="admin-card" onClick={() => navigate("/users")}>
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">{userCounts.agents}</p>
            </div>
            <h4>Agents</h4>
          </div>
        </div>
        <div className="admin-card" onClick={() => navigate("/users")}>
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">{userCounts.supervisors}</p>
            </div>
            <h4>Supervisors</h4>
          </div>
        </div>
        <div className="admin-card" onClick={() => navigate("/users")}>
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">{userCounts.admins}</p>
            </div>
            <h4>Admins</h4>
          </div>
        </div>
        <div className="admin-card" onClick={() => navigate("/users")}>
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">{userCounts.otherUsers}</p>
            </div>
            <h4>Other Users</h4>
          </div>
        </div>
      </div>
      <div className="admin-panels-row">
        <div className="admin-panel admin-panel--chart">
          <div className="admin-panel-header">
            <span>User Summary</span>
            <span className="admin-panel-badge">Total: {totalUsers}</span>
          </div>
          <div className="admin-panel-body admin-panel-body--chart">
            <div className="admin-chart-wrap">
            <Doughnut
              data={userPieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                    labels: {
                      padding: 8,
                      boxWidth: 10,
                      font: { size: 11 },
                      usePointStyle: true,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce(
                          (a, b) => a + b,
                          0
                        );
                        const percentage =
                          total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
            </div>
          </div>
        </div>
        <div className="admin-panel admin-panel--activities">
          <div className="admin-panel-header">Recent User Activities</div>
          <div className="admin-panel-body admin-panel-body--table">
            <table className="admin-activities-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(onlineUsers) &&
                  onlineUsers.map((activity, idx) => (
                    <tr key={idx}>
                      <td>{activity.full_name}</td>
                      <td>
                        <span
                          className={
                            activity.status?.toLowerCase() === "online"
                              ? "admin-status-online"
                              : undefined
                          }
                        >
                          {activity.status}
                        </span>
                      </td>
                      <td>{activity.role}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
