import React, {useEffect, useState} from "react";
import { MdOutlineSupportAgent, MdOutlinePendingActions } from "react-icons/md";
import { Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { baseURL } from "../../../../config";
import "./admin&superAdmin.css";
import { useNavigate } from "react-router-dom";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminAndSuperAdminDashboard() {
  const authToken = localStorage.getItem("authToken");
  const [userCounts, setUserCounts] = useState({
    agents: 0,
    supervisors: 0,
    admins: 0,
    otherUsers: 0,
  });

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
        endpoint = "director-general"
        break;
      case "focal-person":
        endpoint = "focal-person"
        break;
      case "head-of-unit":
        endpoint = "head-of-unit"
        break;
      case "coordinator":
        endpoint = "coordinator"
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
            'content-type': "application/json",
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      const data = await response.json()
      console.log(data);
    } catch (error) {
      
    }
  }
  const fetchPendingRequests = async () => {
    // Placeholder for fetching pending requests/approvals
    // You can replace this with a real API call later
    try {
      // Example: const response = await fetch(`${baseURL}/pending-requests`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      // const data = await response.json();
      // console.log(data);
      console.log('Fetching pending requests...');
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch user counts for each role
  useEffect(() => {
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
                'content-type': "application/json",
                'Authorization': `Bearer ${authToken}`,
              },
            }
          );
          const data = await response.json();
          counts[role.key] = Array.isArray(data) ? data.length : (data.count || 0);
        } catch (error) {
          counts[role.key] = 0;
        }
      }
      // Fetch all users
      let totalUsers = 0;
      try {
        const response = await fetch(
          `${baseURL}/users/`,
          {
            method: "GET",
            headers: {
              'content-type': "application/json",
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );
        const data = await response.json();
        totalUsers = Array.isArray(data) ? data.length : (data.count || 0);
      } catch (error) {
        totalUsers = 0;
      }
      // Calculate other users
      counts.otherUsers = totalUsers - (counts.agents || 0) - (counts.supervisors || 0) - (counts.admins || 0);
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
        data: [userCounts.agents, userCounts.supervisors, userCounts.admins, userCounts.otherUsers],
        backgroundColor: [
          "#36A2EB",
          "#FF6384",
          "#FFCD56",
          "#4BC0C0"
        ],
        borderWidth: 1,
      },
    ],
  };

  // Only show the five most recent activities and filter for allowed statuses
  const allowedStatuses = ["Online", "Offline", "Awaiting Admin"];
  const displayedActivities = recentActivities
    .filter(activity => allowedStatuses.includes(activity.status))
    .slice(0, 5);

  // Calculate total users
  const totalUsers = userCounts.agents + userCounts.supervisors + userCounts.admins + userCounts.otherUsers;

  return (
    <div className="admin-container">
      <h3 className="admin-title">Dashboard</h3>
      <div className="admin-summary">
        <div
          className="admin-card"
          onClick={() => navigate("/users")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">{userCounts.agents}</p>
            </div>
            <h4>Agents</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => navigate("/users")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">{userCounts.supervisors}</p>
            </div>
            <h4>Supervisors</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => navigate("/users")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">{userCounts.admins}</p>
            </div>
            <h4>Admins</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => navigate("/users")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">{userCounts.otherUsers}</p>
            </div>
            <h4>Other Users</h4>
          </div>
        </div>
      </div>
      {/* Side-by-side: Radial chart and Recent User Activities table in cards */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '22px', margin: '20px 0' }}>
        {/* User Summary Card */}
        <div style={{
          maxWidth: 400,
          flex: 1,
          background: '#f9f9f9',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            background: '#f1f3f6',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            padding: '10px 10px',
            borderBottom: '1px solid #e0e0e0',
            fontWeight: 600,
            fontSize: 16,
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>User Summary</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1976d2', background: '#e3f0fa', borderRadius: 8, padding: '2px 12px', marginLeft: 12 }}>
              Total: {totalUsers}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Doughnut data={userPieData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
          </div>
        </div>
        {/* Recent User Activities Card */}
        <div style={{
          flex: 1,
          maxWidth: 540,
          background: '#f9f9f9',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            background: '#f1f3f6',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            padding: '10px 20px',
            borderBottom: '1px solid #e0e0e0',
            fontWeight: 600,
            fontSize: 16,
            color: '#333',
          }}>
            Recent User Activities
          </div>
          <div style={{ padding: 24 }}>
            <table style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              background: '#fcfcfd',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
              <thead>
                <tr style={{ background: '#e9eef5' }}>
                  <th style={{ padding: '14px 12px', border: 'none', textAlign: 'left', color: '#222', fontWeight: 700, fontSize: 15, letterSpacing: 0.2 }}>User</th>
                  <th style={{ padding: '14px 12px', border: 'none', textAlign: 'left', color: '#222', fontWeight: 700, fontSize: 15, letterSpacing: 0.2 }}>Status</th>
                  <th style={{ padding: '14px 12px', border: 'none', textAlign: 'left', color: '#222', fontWeight: 700, fontSize: 15, letterSpacing: 0.2 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {displayedActivities.map((activity, idx) => (
                  <tr key={idx}
                    style={{
                      background: idx % 2 === 0 ? '#f9fafb' : '#fff',
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f0f4f8'}
                    onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#f9fafb' : '#fff'}
                  >
                    <td style={{ padding: '12px 12px', border: 'none', borderRadius: idx === 0 ? '12px 0 0 0' : undefined }}>{activity.user}</td>
                    <td style={{ padding: '12px 12px', border: 'none' }}>{activity.status}</td>
                    <td style={{ padding: '12px 12px', border: 'none', borderRadius: idx === 0 ? '0 12px 0 0' : undefined }}>{activity.date}</td>
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
