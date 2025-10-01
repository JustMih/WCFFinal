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
import "./OnlineAgentsTable.css";

const OnlineAgentsTable = () => {
  const [onlineAgents, setOnlineAgents] = useState([]);

  const getOnlineAgents = async () => {
    try {
      const response = await fetch(`${baseURL}/users/agents-online`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch online agents");
      }

      const data = await response.json();
      console.log("Total agents data:", data);
      setOnlineAgents(data.agents || []);
    } catch (error) {
      console.error("Error fetching online agents:", error);
      setOnlineAgents([]);
    }
  };

  useEffect(() => {
    getOnlineAgents();
    
    // Refresh online agents every 30 seconds
    const interval = setInterval(getOnlineAgents, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="online-agents-container">
      <TableContainer>
        <h3>Online Agents</h3>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agent Name</TableCell>
              <TableCell>Extension</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {onlineAgents.length > 0 ? (
              onlineAgents.map((user) => (
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
                  No online agents available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default OnlineAgentsTable; 