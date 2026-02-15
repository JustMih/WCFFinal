import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Divider, Button, Tooltip } from "@mui/material";

export default function ReviewerActionModal({
  open,
  onClose,
  ticket,
  categories = [],
  units = [],
  convertCategory = {},
  forwardUnit = {},
  handleCategoryChange = () => {},
  handleUnitChange = () => {},
  handleConvertOrForward = () => {},
  handleRating = () => {},
  handleAttend = () => {},
}) {
  const [localStatus, setLocalStatus] = useState(ticket?.status);

  useEffect(() => {
    setLocalStatus(ticket?.status);
  }, [ticket]);

  if (!ticket) return null;

  // Handler for Attend button
  const onAttend = async () => {
    await handleAttend(ticket.id);
    setLocalStatus("Attended");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 500 },
          maxHeight: "80vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1976d2" }}>
          Ticket Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {/* Two-Column Ticket Fields */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Name:</strong> {`${ticket.first_name || "N/A"} ${ticket.middle_name || "N/A"} ${ticket.last_name || "N/A"}`}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Phone:</strong> {ticket.phone_number || "N/A"}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>NIDA:</strong> {ticket.nida_number || "N/A"}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Institution:</strong> {ticket.institution || "N/A"}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Region:</strong> {ticket.region || "N/A"}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>District:</strong> {ticket.district || "N/A"}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Subject:</strong> {ticket.subject || "N/A"}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Category:</strong> {ticket.category || "N/A"}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Channel:</strong> {ticket.channel || "N/A"}
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Rated:</strong>{" "}
              <span style={{
                color: ticket.complaint_type === "Major" ? "red" :
                  ticket.complaint_type === "Minor" ? "orange" :
                    "inherit"
              }}>
                {ticket.complaint_type || "N/A"}
              </span>
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography>
              <strong>Status:</strong>{" "}
              <span style={{
                color: ticket.status === "Open" ? "green" :
                  ticket.status === "Closed" ? "gray" :
                    "blue"
              }}>
                {localStatus || "N/A"}
              </span>
            </Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Created By:</strong> {ticket?.createdBy?.name || "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Assigned To (User ID):</strong> {ticket.assigned_to_id || "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Assigned Role:</strong> {ticket.assigned_to_role || "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 45%" }}>
            <Typography><strong>Created At:</strong> {ticket.created_at ? new Date(ticket.created_at).toLocaleString("en-US", {
              month: "numeric", day: "numeric", year: "numeric",
              hour: "numeric", minute: "2-digit", hour12: true
            }) : "N/A"}</Typography>
          </div>
          <div style={{ flex: "1 1 100%" }}>
            <Typography><strong>Description:</strong> {ticket.description || "N/A"}</Typography>
          </div>
        </div>

        {/* Action Buttons */}
        <Box
          sx={{
            mt: 3,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center"
          }}
        >
          {/* Show only Attend if status is Open */}
          {localStatus === "Open" && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={onAttend}
            >
              Attend
            </Button>
          )}

          {/* Show all other actions if status is Attended */}
          {localStatus === "Attended" && (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleConvertOrForward(ticket.id, "close")}
              >
                Close Ticket
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleRating(ticket.id, "Minor")}
              >
                Minor
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleRating(ticket.id, "Major")}
              >
                Major
              </Button>
              {ticket.category === "Complaint" && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <select
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.8rem",
                      height: "32px",
                      borderRadius: "4px"
                    }}
                    value={convertCategory[ticket.id] || ""}
                    onChange={(e) =>
                      handleCategoryChange(ticket.id, e.target.value)
                    }
                  >
                    <option value="">Convert To</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleConvertOrForward(ticket.id, "convert")}
                  >
                    Convert
                  </Button>
                </Box>
              )}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <select
                  style={{
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    height: "32px",
                    borderRadius: "4px"
                  }}
                  value={forwardUnit[ticket.id] || ticket.section || ticket.responsible_unit_name || ""}
                  onChange={(e) =>
                    handleUnitChange(ticket.id, e.target.value)
                  }
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.name} value={unit.name}>{unit.name}</option>
                  ))}
                </select>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleConvertOrForward(ticket.id, "forward")}
                >
                  Forward
                </Button>
              </Box>
            </>
          )}
        </Box>

        {/* Close Button */}
        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Button color="primary" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
} 