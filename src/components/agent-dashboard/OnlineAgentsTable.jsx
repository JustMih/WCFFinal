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
import {
  formatActivityLabel,
  activityToBadgeClass,
  getRemainingSecondsFromStart,
  getExceededSecondsFromStart,
  formatRemainingTime,
  formatExceededTime,
} from "../../utils/pauseActivities";
import "./OnlineAgentsTable.css";

const OnlineAgentsTable = () => {
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [, setTick] = useState(0);

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
      setOnlineAgents(data.agents || []);
    } catch (error) {
      console.error("Error fetching online agents:", error);
      setOnlineAgents([]);
    }
  };

  const hasPausedAgents = onlineAgents.some((a) => a.status === "pause");

  useEffect(() => {
    getOnlineAgents();
    const intervalMs = hasPausedAgents ? 10000 : 30000;
    const interval = setInterval(getOnlineAgents, intervalMs);
    return () => clearInterval(interval);
  }, [hasPausedAgents]);

  useEffect(() => {
    if (!hasPausedAgents) return undefined;
    const tickInterval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(tickInterval);
  }, [hasPausedAgents]);

  const renderStatus = (user) => {
    if (user.status === "online") {
      return <span className="status-badge online">Online</span>;
    }
    if (user.status === "pause" && user.pause_activity) {
      const allowed = user.pause_allowed_seconds;
      const isExceeded =
        user.is_exceeded ??
        getExceededSecondsFromStart(
          user.pause_activity,
          user.pause_started_at,
          {},
          allowed
        ) > 0;
      const exceeded =
        user.exceeded_seconds ??
        getExceededSecondsFromStart(
          user.pause_activity,
          user.pause_started_at,
          {},
          allowed
        );
      const remaining =
        user.remaining_seconds ??
        getRemainingSecondsFromStart(
          user.pause_activity,
          user.pause_started_at,
          {},
          allowed
        );
      const label = formatActivityLabel(user.pause_activity);
      const badgeClass = isExceeded
        ? "exceeded"
        : activityToBadgeClass(user.pause_activity);

      return (
        <span className={`status-badge ${badgeClass}`}>
          {label}
          {isExceeded
            ? ` — Exceeded ${formatExceededTime(exceeded)}`
            : ` (${formatRemainingTime(remaining)} left)`}
        </span>
      );
    }
    return (
      <span className="status-badge pause">{user.status || "Pause"}</span>
    );
  };

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
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.extension}</TableCell>
                  <TableCell>{renderStatus(user)}</TableCell>
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
