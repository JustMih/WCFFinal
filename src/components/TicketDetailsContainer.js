import React, { useState, useEffect } from "react";
import TicketDetailsModal from "./TicketDetailsModal";
import { baseURL } from "../config";
import { CircularProgress, Box } from "@mui/material";

export default function TicketDetailsContainer({ ticketId, open, onClose }) {
  const [ticketDetails, setTicketDetails] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ticketId) {
      setLoading(true);
      const fetchDetails = async () => {
        try {
          const token = localStorage.getItem("authToken");
          // Fetch ticket details
          const ticketRes = await fetch(`${baseURL}/ticket/${ticketId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const ticketData = await ticketRes.json();

          // Fetch assignment history
          const historyRes = await fetch(`${baseURL}/ticket/${ticketId}/assignments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const historyData = await historyRes.json();

          // Find the last assignment if ticket is closed
          let closedBy = null;
          let closureDetails = null;
          if (ticketData.status === 'Closed' && Array.isArray(historyData) && historyData.length > 0) {
            const lastAssignment = historyData[historyData.length - 1];
            closedBy = lastAssignment.assigned_to_name || lastAssignment.assigned_to_id || null;
            closureDetails = lastAssignment.reason || null;
          }

          setTicketDetails({ ...ticketData, closedBy, closureDetails });
          setAssignmentHistory(historyData);
        } catch (e) {
          setTicketDetails(null);
          setAssignmentHistory([]);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setTicketDetails(null);
      setAssignmentHistory([]);
    }
  }, [open, ticketId]);

  if (!open) return null;

  return loading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <CircularProgress />
    </Box>
  ) : (
    <TicketDetailsModal
      open={open}
      onClose={onClose}
      selectedTicket={ticketDetails}
      assignmentHistory={assignmentHistory}
      renderAssignmentStepper={undefined} // or pass if needed
    />
  );
} 