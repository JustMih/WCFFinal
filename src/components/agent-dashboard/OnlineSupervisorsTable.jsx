import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { baseURL } from "../../config";
import "./OnlineSupervisorsTable.css";

const OnlineSupervisorsTable = () => {
  const [onlineSupervisors, setOnlineSupervisors] = useState([]);

  const getOnlineSupervisors = async () => {
    try {
      const response = await fetch(`${baseURL}/users/supervisors-online`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch online supervisors");
      }

      const data = await response.json();
      console.log("Total supervisors data:", data);
      setOnlineSupervisors(data.supervisors || []);
    } catch (error) {
      console.error("Error fetching online supervisors:", error);
      setOnlineSupervisors([]);
    }
  };

  useEffect(() => {
    getOnlineSupervisors();
    
    // Refresh online supervisors every 30 seconds
    const interval = setInterval(getOnlineSupervisors, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="online-supervisors-container">
      <TableContainer>
        <h3>Online Supervisors</h3>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Supervisor Name</TableCell>
              <TableCell>Extension</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {onlineSupervisors.length > 0 ? (
              onlineSupervisors.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.extension}</TableCell>
                  <TableCell>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No online supervisors available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default OnlineSupervisorsTable; 