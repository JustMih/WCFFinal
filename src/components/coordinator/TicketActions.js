import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

const resolutionTypes = [
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Not Applicable', label: 'Not Applicable' },
  { value: 'Duplicate', label: 'Duplicate' }
];

const TicketActions = ({ ticket, onTicketUpdate }) => {
  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [resolutionDetails, setResolutionDetails] = useState('');
  const [resolutionType, setResolutionType] = useState('Resolved');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCloseTicket = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(
        `/api/tickets/${ticket.id}/close-coordinator-ticket`,
        {
          userId: localStorage.getItem('userId'),
          resolution_details: resolutionDetails,
          resolution_type: resolutionType
        }
      );

      if (response.data) {
        onTicketUpdate(response.data.ticket);
        setOpenCloseDialog(false);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to close ticket');
    } finally {
      setLoading(false);
    }
  };

  // Only show close button for open tickets that are complaints, suggestions, or compliments
  const showCloseButton = 
    ticket.status !== 'Closed' && 
    ['Complaint', 'Suggestion', 'Compliment'].includes(ticket.category);

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {showCloseButton && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenCloseDialog(true)}
            startIcon={<CheckCircleIcon />}
            size="small"
          >
            Close Ticket
          </Button>
        )}
      </Box>

      {/* Close Ticket Dialog */}
      <Dialog 
        open={openCloseDialog} 
        onClose={() => setOpenCloseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Close {ticket.category}
          <IconButton
            aria-label="close"
            onClick={() => setOpenCloseDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stack spacing={2}>
              <TextField
                select
                fullWidth
                label="Resolution Type"
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value)}
              >
                {resolutionTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Resolution Details"
                value={resolutionDetails}
                onChange={(e) => setResolutionDetails(e.target.value)}
                error={!resolutionDetails}
                helperText={!resolutionDetails ? 'Resolution details are required' : ''}
              />
            </Stack>
            {error && (
              <Box sx={{ color: 'error.main', mt: 1 }}>
                {error}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenCloseDialog(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCloseTicket}
            variant="contained"
            color="primary"
            disabled={loading || !resolutionDetails}
          >
            {loading ? 'Closing...' : 'Close Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TicketActions; 