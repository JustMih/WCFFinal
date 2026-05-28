import React from "react";
import { Chip } from "@mui/material";
import {
  normalizeCallbackStatus,
  callbackStatusLabel,
} from "./missedCallActions";

export const OFF_HOURS_CALLBACK_STATUS_COLORS = {
  pending: "#ef4444",
  called_back: "#22c55e",
  ignored: "#9ca3af",
};

export function getOffHoursTimestamp(record) {
  return record?.time || record?.created_at || record?.cdrstarttime;
}

export function isOffHoursNotePlayed(note, playedStatus = {}) {
  return Boolean(playedStatus[note?.id] || note?.is_played);
}

export function getOffHoursRowColor(note, playedStatus = {}) {
  if (isOffHoursNotePlayed(note, playedStatus)) return "#d4edda";
  const createdAt = new Date(note?.created_at);
  if (Number.isNaN(createdAt.getTime())) return "#fff3cd";
  const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursAgo >= 24 ? "#f8d7da" : "#fff3cd";
}

export function OffHoursCallbackStatusChip({ record }) {
  const status = normalizeCallbackStatus(record);
  return (
    <Chip
      label={callbackStatusLabel(status)}
      size="small"
      sx={{
        backgroundColor:
          OFF_HOURS_CALLBACK_STATUS_COLORS[status] || "#666",
        color: "#fff",
        fontWeight: "bold",
      }}
    />
  );
}
