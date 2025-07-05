import React from 'react';
import {
  Box,
  Button,
  Divider,
  Modal,
  Typography
} from '@mui/material';

const TicketDetailsModal = ({ open, onClose, ticket }) => {
  if (!ticket) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'red';
      case 'In Progress': return 'orange';
      case 'Closed': return 'green';
      default: return 'inherit';
    }
  };

  const getRatedColor = (rated) => {
    switch (rated) {
      case 'Major': return 'red';
      case 'Minor': return 'green';
      default: return 'inherit';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const ticketDetails = [
    ["Name", `${ticket.first_name || "N/A"} ${ticket.middle_name || ""} ${ticket.last_name || "N/A"}`],
    ["Phone", ticket.phone_number || "N/A"],
    ["NIN", ticket.nida_number || "N/A"],
    ["Requester", ticket.requester || "N/A"],
    ["Region", ticket.region || "N/A"],
    ["District", ticket.district || "N/A"],
    ["Category", ticket.category || "N/A"],
    ["Subject", ticket.subject || "N/A"],
    ["Section", ticket.responsibleSection?.name || "N/A"],
    ["Function", ticket.responsibleSection?.functions?.[0]?.name || "N/A"],
    ["Function Data", ticket.responsibleSection?.functions?.[0]?.functionData?.[0]?.name || "N/A"],
    ["Channel", ticket.channel || "N/A"],
    ["Rated", ticket.complaint_type || "Unrated"],
    ["Status", ticket.status || "N/A"],
    ["Assigned To", ticket.assignee?.name || "N/A"],
    ["Assigned Role", ticket.assigned_to_role || "N/A"],
    ["Created By", ticket.creator?.name || "N/A"],
    ["Created At", formatDate(ticket.created_at)],
    ["Attended By", ticket.attendedBy?.name || "N/A"],
    ["Rated By", ticket.ratedBy?.name || "N/A"],
    ["Converted By", ticket.convertedBy?.name || "N/A"],
    ["Forwarded By", ticket.forwardedBy?.name || "N/A"]
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 600 },
          maxHeight: "80vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 3
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>
          Ticket Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ticketDetails.reduce((rows, item, index, arr) => {
            if (index % 2 === 0) {
              const pair = [item, arr[index + 1] || ["", ""]];
              rows.push(pair);
            }
            return rows;
          }, []).map(([left, right], i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ flex: 1 }}>
                <strong>{left[0]}:</strong> {
                  left[0] === "Status" ? (
                    <span style={{ color: getStatusColor(left[1]) }}>
                      {left[1]}
                    </span>
                  ) : left[0] === "Rated" ? (
                    <span style={{ color: getRatedColor(left[1]) }}>
                      {left[1]}
                    </span>
                  ) : left[1]
                }
              </Typography>
              <Typography sx={{ flex: 1 }}>
                <strong>{right[0]}:</strong> {
                  right[0] === "Status" ? (
                    <span style={{ color: getStatusColor(right[1]) }}>
                      {right[1]}
                    </span>
                  ) : right[0] === "Rated" ? (
                    <span style={{ color: getRatedColor(right[1]) }}>
                      {right[1]}
                    </span>
                  ) : right[1]
                }
              </Typography>
            </Box>
          ))}

          <Box sx={{ mt: 2 }}>
            <Typography><strong>Description:</strong> {ticket.description || "N/A"}</Typography>
          </Box>
          {/* Representative Details Section */}
          {ticket.requester === "Representative" && ticket.RequesterDetail && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Representative Details
              </Typography>
              <Typography><strong>Name:</strong> {ticket.RequesterDetail.name || 'N/A'}</Typography>
              <Typography><strong>Phone:</strong> {ticket.RequesterDetail.phoneNumber || 'N/A'}</Typography>
              <Typography><strong>Email:</strong> {ticket.RequesterDetail.email || 'N/A'}</Typography>
              <Typography><strong>Address:</strong> {ticket.RequesterDetail.address || 'N/A'}</Typography>
              <Typography><strong>Relationship to Employee:</strong> {ticket.RequesterDetail.relationshipToEmployee || 'N/A'}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 3, textAlign: "right" }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onClose}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default TicketDetailsModal; 