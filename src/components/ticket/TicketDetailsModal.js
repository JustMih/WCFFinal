import React from 'react';
import {
  Box,
  Button,
  Divider,
  Modal,
  Typography,
  Chip,
  Link
} from '@mui/material';
import { Download, AttachFile } from '@mui/icons-material';
import { baseURL } from "../../config";

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

  const getFileNameFromPath = (filePath) => {
    if (!filePath) return '';
    return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
  };

  const handleDownloadAttachment = (attachmentPath) => {
    if (!attachmentPath) return;
    
    const filename = getFileNameFromPath(attachmentPath);
    const downloadUrl = `${baseURL}/attachment/${filename}`;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

          {/* Dependents Section */}
          {ticket.dependents && ticket.dependents.trim() !== "" && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e9ecef' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: '1.2rem' }}>👥</span>
                Dependents
              </Typography>
              
              {/* Parse comma-separated dependents string to array */}
              {(() => {
                const dependentsArray = ticket.dependents.split(',').map(dep => dep.trim()).filter(dep => dep);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {dependentsArray.map((dependent, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "12px",
                          backgroundColor: "#ffffff",
                          borderRadius: "6px",
                          border: "1px solid #dee2e6",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px"
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#e3f2fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#1976d2",
                            fontWeight: "bold",
                            fontSize: "0.875rem"
                          }}
                        >
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            style={{ fontWeight: "600", color: "#2c3e50" }}
                          >
                            {dependent}
                          </Typography>
                          <Typography
                            variant="caption"
                            style={{ color: "#6c757d" }}
                          >
                            Dependent #{index + 1}
                          </Typography>
                        </div>
                        <div
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#e8f5e9",
                            borderRadius: "12px",
                            border: "1px solid #c8e6c9"
                          }}
                        >
                          <Typography
                            variant="caption"
                            style={{ color: "#2e7d32", fontWeight: "500" }}
                          >
                            Active
                          </Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </Box>
          )}

          {/* Resolution Details Section (for closed tickets) */}
          {ticket.status === "Closed" && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #dee2e6' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#28a745' }}>
                Resolution Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography><strong>Resolution Type:</strong> 
                  <Chip 
                    label={ticket.resolution_type || "Resolved"} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography><strong>Resolution Details:</strong></Typography>
                <Typography sx={{ mt: 1, pl: 2, fontStyle: 'italic' }}>
                  {ticket.resolution_details || "No resolution details provided"}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography><strong>Date of Resolution:</strong> {formatDate(ticket.date_of_resolution)}</Typography>
              </Box>
              
              {/* Attachment Section */}
              {ticket.attachment_path && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px solid #ced4da' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                    <AttachFile sx={{ mr: 1, fontSize: 20 }} />
                    Resolution Attachment
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {getFileNameFromPath(ticket.attachment_path)}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownloadAttachment(ticket.attachment_path)}
                      sx={{ minWidth: 'auto' }}
                    >
                      Download
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Assignment History Attachments */}
          {ticket.assignments && ticket.assignments.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f8ff', borderRadius: 2, border: '1px solid #b3d9ff' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#0066cc' }}>
                Assignment History Attachments
              </Typography>
              {ticket.assignments
                .filter(assignment => assignment.attachment_path)
                .map((assignment, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px solid #b3d9ff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <AttachFile sx={{ mr: 1, fontSize: 16 }} />
                        {assignment.action} - {assignment.assigned_to_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {formatDate(assignment.created_at)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {getFileNameFromPath(assignment.attachment_path)}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={() => handleDownloadAttachment(assignment.attachment_path)}
                        sx={{ minWidth: 'auto' }}
                      >
                        Download
                      </Button>
                    </Box>
                    {assignment.reason && (
                      <Typography variant="body2" sx={{ mt: 1, pl: 2, fontStyle: 'italic', color: '#666' }}>
                        Note: {assignment.reason}
                      </Typography>
                    )}
                  </Box>
                ))}
              {ticket.assignments.filter(assignment => assignment.attachment_path).length === 0 && (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666' }}>
                  No attachments found in assignment history
                </Typography>
              )}
            </Box>
          )}

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