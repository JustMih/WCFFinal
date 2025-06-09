import React, {useEffect} from "react";
import { MdOutlineSupportAgent } from "react-icons/md";
import { baseURL } from "../../../../config";
import "./admin&superAdmin.css";

export default function AdminAndSuperAdminDashboard() {
  const authToken = localStorage.getItem("authToken");
  const fetchAdminSummaryByCategory = async (category) => {
    let endpoint = "";
    switch (category) {
      case "agents":
        endpoint = "agent";
        break;
      case "admin":
        endpoint = "admin";
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
  return (
    <div className="admin-container">
      <h3 className="admin-title">Dashboard</h3>
      <div className="admin-summary">
        <div
          className="admin-card"
          onClick={() => fetchAdminSummaryByCategory("agents")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Agents</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => fetchAdminSummaryByCategory("agents")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Admin</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => fetchAdminSummaryByCategory("agents")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Supervisor</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => fetchAdminSummaryByCategory("agents")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Manager</h4>
          </div>
        </div>
      </div>
      <div className="admin-summary">
        <div
          className="admin-card"
          onClick={() => fetchAdminSummaryByCategory("agents")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Coordinator</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => fetchAdminSummaryByCategory("agents")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Focal Person</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => fetchAdminSummaryByCategory("agents")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Attendee</h4>
          </div>
        </div>
        <div
          className="admin-card"
          onClick={() => fetchAdminSummaryByCategory("agents")}
        >
          <div className="admin-card-icon">
            <div className="admin-data">
              <MdOutlineSupportAgent />
              <p className="admin-value">10</p>
            </div>
            <h4>Total Director General</h4>
          </div>
        </div>
      </div>

      {/* table show when user click any card to display data */}
      <div className="user-table-container">
        {/* Table content will go here */}
        <h4 className="admin-table-title">User Summary</h4>
        <table className="admin-table-content">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {/* Sample data, replace with actual data */}
            <tr>
              <td>John Doe</td>
              <td>Agent</td>
              <td>John@gmail.com</td>
              <td>+1234567890</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
