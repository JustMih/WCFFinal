import React, { useState } from "react";
import { FaSearch, FaPlus } from "react-icons/fa";
import { Modal, Box, Typography, Button, Snackbar, Alert, Divider, IconButton } from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import TicketUpdates from '../ticket/TicketUpdates';

const PhoneSearchSection = ({
  onSearch,
  onNewTicket,
  onShowAdvancedModal,
  onViewTicketDetails,
  phoneSearch,
  setPhoneSearch,
  snackbar,
  setSnackbar
}) => {
  const [newTicketConfirmationModal, setNewTicketConfirmationModal] = useState(false);
  const [existingTicketsModal, setExistingTicketsModal] = useState(false);
  const [foundTickets, setFoundTickets] = useState([]);
  const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
  const [selectedTicketForJustification, setSelectedTicketForJustification] = useState(null);

  const handlePhoneSearch = async (searchValue) => {
    if (!searchValue.trim()) {
      setNewTicketConfirmationModal(true);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const baseURL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5070/api";

      const response = await fetch(
        `${baseURL}/ticket/search-by-phone/${searchValue}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.found) {
        setFoundTickets(data.tickets);
        setExistingTicketsModal(true);
        onSearch(searchValue, data.tickets);
      } else {
        setNewTicketConfirmationModal(true);
      }
    } catch (error) {
      console.error("Error searching tickets:", error);
      setSnackbar({
        open: true,
        message: "Error searching tickets",
        severity: "error"
      });
    }
  };

  const handleNewTicketConfirmation = (confirmed) => {
    if (confirmed) {
      onNewTicket(phoneSearch);
    }
    setNewTicketConfirmationModal(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenJustificationHistory = (ticket) => {
    setSelectedTicketForJustification(ticket);
    setIsJustificationModalOpen(true);
  };

  const handleCloseJustificationModal = () => {
    setIsJustificationModalOpen(false);
    setSelectedTicketForJustification(null);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <input
          className="crm-search-input"
          type="text"
          placeholder="Search by phone or NIDA..."
          value={phoneSearch}
          onChange={(e) => setPhoneSearch(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handlePhoneSearch(phoneSearch);
          }}
          style={{ flex: 1 }}
        />
        <button
          className="search-btn"
          onClick={() => handlePhoneSearch(phoneSearch)}
          aria-label="Search"
        >
          <FaSearch />
        </button>
        <button 
          className="add-user-button" 
          onClick={() => onShowAdvancedModal(true)}
        >
          <FaPlus /> New Ticket
        </button>
      </div>

      {/* Existing Tickets Modal */}
      <Modal
        open={existingTicketsModal}
        onClose={() => setExistingTicketsModal(false)}
      >
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
            p: 3,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Existing Tickets for {phoneSearch}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {foundTickets.map((ticket) => (
            <Box
              key={ticket.id}
              sx={{ mb: 2, p: 2, border: "1px solid #eee", borderRadius: 1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">
                  Ticket ID: {ticket.ticket_id}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '12px',
                      color: 'white',
                      background:
                        ticket.status === 'Closed'
                          ? '#757575'
                          : ticket.status === 'Open'
                          ? '#2e7d32'
                          : '#1976d2',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    {ticket.status || "Escalated"}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenJustificationHistory(ticket);
                    }}
                    sx={{
                      color: '#1976d2',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.1)'
                      }
                    }}
                    title="View Ticket Updates"
                  >
                    <ChatIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Typography>
                Created: {new Date(ticket.created_at).toLocaleDateString()}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setExistingTicketsModal(false);
                  if (onViewTicketDetails) {
                    onViewTicketDetails(ticket);
                  }
                }}
                sx={{ mt: 1 }}
              >
                View Details
              </Button>
            </Box>
          ))}

          <Box
            sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setExistingTicketsModal(false);
                setNewTicketConfirmationModal(true);
              }}
            >
              Create New Ticket
            </Button>
            <Button
              variant="outlined"
              onClick={() => setExistingTicketsModal(false)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* No Existing Tickets Found Modal */}
      <Modal
        open={newTicketConfirmationModal}
        onClose={() => setNewTicketConfirmationModal(false)}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 400 },
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            No Existing Tickets Found
          </Typography>
          <Typography sx={{ mb: 2 }}>
            Would you like to create a new ticket for {phoneSearch}?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleNewTicketConfirmation(true)}
            >
              Yes, Create Ticket
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleNewTicketConfirmation(false)}
            >
              No, Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={handleSnackbarClose}
          sx={{ 
            minWidth: '300px',
            fontSize: '14px',
            fontWeight: snackbar.severity === 'success' ? 'bold' : 'normal'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Justification History Modal */}
      <Modal
        open={isJustificationModalOpen}
        onClose={handleCloseJustificationModal}
      >
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
            p: 3
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            View Updates
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box>
            <TicketUpdates 
              ticketId={selectedTicketForJustification?.id}
              currentUserId={localStorage.getItem('userId')}
              canAddUpdates={selectedTicketForJustification?.status !== 'Closed' && selectedTicketForJustification?.status !== 'Attended and Recommended'}
              isAssigned={selectedTicketForJustification?.assigned_to_id === localStorage.getItem('userId')}
            />
          </Box>
          <Box
            sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleCloseJustificationModal}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default PhoneSearchSection;
