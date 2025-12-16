import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Update as UpdateIcon,
  Person as PersonIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { baseURL } from "../../config";

const TicketUpdates = ({ ticketId, currentUserId, canAddUpdates = true, isAssigned = true, ticketStatus }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [editText, setEditText] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');



  // Fetch updates
  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/ticket-updates/ticket/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUpdates(data.data || []);
      } else {
        setError('Failed to fetch updates');
      }
    } catch (error) {
      setError('Error fetching updates');
    } finally {
      setLoading(false);
    }
  };

  // Add new update
  const handleAddUpdate = async () => {
    if (!newUpdate.trim()) return;

    setAddingUpdate(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/ticket-updates/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          update_text: newUpdate.trim()
        })
      });

      if (response.ok) {
        setNewUpdate('');
        setShowUpdateForm(false);
        setSuccess('Update added successfully');
        fetchUpdates();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add update');
      }
    } catch (error) {
      setError('Error adding update');
    } finally {
      setAddingUpdate(false);
    }
  };

  // Edit update
  const handleEditUpdate = async () => {
    if (!editText.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/api/ticket-updates/${editingUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          update_text: editText.trim()
        })
      });

      if (response.ok) {
        setShowEditDialog(false);
        setEditingUpdate(null);
        setEditText('');
        setSuccess('Update modified successfully');
        fetchUpdates();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to modify update');
      }
    } catch (error) {
      setError('Error modifying update');
    }
  };

  // Delete update
  const handleDeleteUpdate = async (updateId) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/api/ticket-updates/${updateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Update deleted successfully');
        fetchUpdates();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete update');
      }
    } catch (error) {
      setError('Error deleting update');
    }
  };

  // Open edit dialog
  const openEditDialog = (update) => {
    setEditingUpdate(update);
    setEditText(update.update_text);
    setShowEditDialog(true);
  };

  useEffect(() => {
    if (ticketId) {
      fetchUpdates();
    }
  }, [ticketId]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <Box sx={{ mt: 0 }}>
      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UpdateIcon />
          Ticket Updates
        </Typography>
        {canAddUpdates && isAssigned && !showUpdateForm && (
          <Button
            variant="contained"
            onClick={() => setShowUpdateForm(true)}
            startIcon={<AddIcon />}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              py: 0.75
            }}
          >
            Add New Update
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Add new update form */}
      {canAddUpdates && isAssigned && showUpdateForm && (
        <Paper sx={{ p: 2.5, mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your daily progress update..."
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                size="medium"
                onClick={() => {
                  setShowUpdateForm(false);
                  setNewUpdate('');
                }}
                sx={{ textTransform: 'none', borderRadius: 1.5 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddUpdate}
                disabled={!newUpdate.trim() || addingUpdate}
                startIcon={addingUpdate ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                sx={{ 
                  textTransform: 'none',
                  borderRadius: 1.5,
                  px: 3
                }}
              >
                {addingUpdate ? 'Adding...' : 'Add Update'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Updates list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : updates.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {updates.map((update) => (
            <Card key={update.id} variant="outlined">
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="primary">
                      {update.user_name}
                    </Typography>
                    <Chip 
                      label={update.user_role} 
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(update.update_date)}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                  {update.update_text}
                </Typography>

                {/* Action buttons - only show for user's own updates */}
                {update.user_id === currentUserId && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(update)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUpdate(update.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        // Empty state - show different messages based on ticket status and user assignment
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: ticketStatus === 'Closed' ? '#f0f7ff' : '#f8f9fa', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <InfoIcon sx={{ fontSize: 56, color: ticketStatus === 'Closed' ? '#1976d2' : '#6c757d' }} />
            <Typography variant="h6" color={ticketStatus === 'Closed' ? 'primary' : 'text.secondary'} sx={{ fontWeight: 'bold' }}>
              {ticketStatus === 'Closed' 
                ? 'Ticket Closed' 
                : 'No Updates Available'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
              {ticketStatus === 'Closed' 
                ? 'This ticket has been closed. No further updates are available. The ticket has been resolved and completed.' 
                : !isAssigned 
                  ? 'You are not assigned to this ticket. Only assigned users can add updates.' 
                  : 'There are no updates for this ticket yet. Updates will appear here once they are added by assigned team members.'}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Update</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter your update..."
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditUpdate} variant="contained" disabled={!editText.trim()}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketUpdates;
