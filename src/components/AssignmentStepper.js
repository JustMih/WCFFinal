import React from "react";
import { Box, Typography } from "@mui/material";

export default function AssignmentStepper({ assignmentHistory, selectedTicket }) {
  const steps = [
    {
      assigned_to_name: selectedTicket.created_by ||
        (selectedTicket.creator && selectedTicket.creator.name) ||
        `${selectedTicket.first_name || ""} ${selectedTicket.last_name || ""}`.trim() ||
        "N/A",
      assigned_to_role: "Creator",
      action: "Created",
      created_at: selectedTicket.created_at,
      assigned_to_id: "creator"
    }
  ];
  if (Array.isArray(assignmentHistory) && assignmentHistory.length > 0) {
    steps.push(...assignmentHistory);
  } else if (
    selectedTicket.assigned_to_id &&
    selectedTicket.assigned_to_id !== "creator"
  ) {
    steps.push({
      assigned_to_name: selectedTicket.assigned_to_name || selectedTicket.assigned_to_id || "Unknown",
      assigned_to_role: selectedTicket.assigned_to_role || "Unknown",
      action: selectedTicket.status === "Assigned" ? "Assigned" : "Open",
      created_at: selectedTicket.assigned_at,
      assigned_to_id: selectedTicket.assigned_to_id
    });
  }
  let currentAssigneeIdx = 0;
  if (
    selectedTicket.status === "Open" &&
    (!selectedTicket.assigned_to_id || steps.length === 1)
  ) {
    currentAssigneeIdx = 0;
  } else {
    const idx = steps.findIndex(
      a => a.assigned_to_id === selectedTicket.assigned_to_id
    );
    currentAssigneeIdx = idx !== -1 ? idx : steps.length - 1;
  }
  return (
    <Box>
      {steps.map((a, idx) => (
        <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              bgcolor:
                idx < currentAssigneeIdx
                  ? "green"
                  : idx === currentAssigneeIdx
                  ? "#1976d2"
                  : "gray",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold"
            }}
          >
            {idx + 1}
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
              {a.assigned_to_name} ({a.assigned_to_role})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {a.action} - {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
            </Typography>
            {a.attachment_path ? (
              <Typography
                variant="body2"
                sx={{ color: '#28a745', fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => handleDownloadAttachment(a.attachment_path)}
              >
                Download attachment
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: '#28a745', fontStyle: 'italic' }}>
                No attachment
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
} 