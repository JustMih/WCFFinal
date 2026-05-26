import React, { useState, useEffect, useRef } from 'react';
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
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Popper,
  ClickAwayListener
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
  
  // @ Mention states
  const [mentionUsers, setMentionUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  const textFieldRef = useRef(null);



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

  // Fetch mention users
  const fetchMentionUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/ticket/${ticketId}/mention-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMentionUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching mention users:', error);
    }
  };

  // Handle @ mention detection
  const handleTextChange = (e, isEdit = false) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    if (isEdit) {
      setEditText(value);
    } else {
      setNewUpdate(value);
    }
    
    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space or newline after @ (meaning mention is complete)
      if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
        setShowMentions(false);
        return;
      }
      
      // Get query after @
      const query = textAfterAt.toLowerCase();
      setMentionQuery(query);
      
      // Show mentions dropdown
      if (textFieldRef.current) {
        const rect = textFieldRef.current.getBoundingClientRect();
        setMentionPosition({
          top: rect.top + rect.height,
          left: rect.left
        });
        setMentionAnchorEl(textFieldRef.current);
      }
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  // Filter mention users based on query
  const filteredMentionUsers = mentionUsers.filter(user => {
    if (!mentionQuery) return true;
    const query = mentionQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  // Handle mention selection
  const handleMentionSelect = (user, isEdit = false) => {
    const currentText = isEdit ? editText : newUpdate;
    const cursorPosition = isEdit ? textFieldRef.current?.selectionStart || 0 : textFieldRef.current?.selectionStart || 0;
    const textBeforeCursor = currentText.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textBeforeAt = currentText.substring(0, lastAtIndex);
      const textAfterCursor = currentText.substring(cursorPosition);
      const mentionText = `@${user.name} `;
      const newText = textBeforeAt + mentionText + textAfterCursor;
      
      if (isEdit) {
        setEditText(newText);
      } else {
        setNewUpdate(newText);
      }
      
      setShowMentions(false);
      setMentionQuery('');
      
      // Set cursor position after mention
      setTimeout(() => {
        if (textFieldRef.current) {
          const newCursorPos = lastAtIndex + mentionText.length;
          textFieldRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textFieldRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle keyboard navigation in mentions
  const handleMentionKeyDown = (e, isEdit = false) => {
    if (!showMentions || filteredMentionUsers.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev < filteredMentionUsers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev > 0 ? prev - 1 : filteredMentionUsers.length - 1
      );
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (filteredMentionUsers[selectedMentionIndex]) {
        handleMentionSelect(filteredMentionUsers[selectedMentionIndex], isEdit);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchUpdates();
      fetchMentionUsers();
    }
  }, [ticketId]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  // Parse text and highlight mentions
  const parseMentions = (text) => {
    if (!text) return null;
    
    // Regex to match @mentions - exactly two words after @
    // Format: @word1 word2 (stops after second word)
    const mentionRegex = /@(\S+\s+\S+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add mention with styling
      parts.push({
        type: 'mention',
        content: match[0], // Full match including @
        username: match[1] // Just the username/name part
      });
      
      lastIndex = mentionRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    // If no mentions found, return original text
    if (parts.length === 0) {
      return [{ type: 'text', content: text }];
    }
    
    return parts;
  };

  // Render text with mentions highlighted
  const renderTextWithMentions = (text) => {
    const parts = parseMentions(text);
    
    if (!parts || parts.length === 0) {
      return <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>{text}</Typography>;
    }
    
    return (
      <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
        {parts.map((part, index) => {
          if (part.type === 'mention') {
            return (
              <Box
                key={index}
                component="span"
                sx={{
                  color: '#1976d2', // Blue color for mentions
                  fontWeight: 600,
                  backgroundColor: '#e3f2fd', // Light blue background
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  margin: '0 2px'
                }}
              >
                {part.content}
              </Box>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </Typography>
    );
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
            <Box sx={{ position: 'relative' }}>
              <TextField
                inputRef={textFieldRef}
                fullWidth
                multiline
                rows={4}
                placeholder="Enter your daily progress update... Type @ to mention users"
                value={newUpdate}
                onChange={(e) => handleTextChange(e, false)}
                onKeyDown={(e) => handleMentionKeyDown(e, false)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5
                  }
                }}
              />
              {showMentions && filteredMentionUsers.length > 0 && (
                <ClickAwayListener onClickAway={() => setShowMentions(false)}>
                  <Popper
                    open={showMentions}
                    anchorEl={mentionAnchorEl}
                    placement="bottom-start"
                    style={{ zIndex: 1300, width: mentionAnchorEl?.offsetWidth || 300 }}
                  >
                    <Paper
                      elevation={4}
                      sx={{
                        maxHeight: 200,
                        overflow: 'auto',
                        mt: 1,
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <List dense>
                        {filteredMentionUsers.map((user, index) => (
                          <ListItem
                            key={user.id}
                            button
                            selected={index === selectedMentionIndex}
                            onClick={() => handleMentionSelect(user, false)}
                            sx={{
                              '&:hover': { backgroundColor: '#f5f5f5' },
                              '&.Mui-selected': { backgroundColor: '#e3f2fd' }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                                {user.name.charAt(0).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={user.name}
                              secondary={`${user.role}${user.unit_section ? ` • ${user.unit_section}` : ''}`}
                              primaryTypographyProps={{ fontSize: '0.875rem' }}
                              secondaryTypographyProps={{ fontSize: '0.75rem' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Popper>
                </ClickAwayListener>
              )}
            </Box>
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
                
                {renderTextWithMentions(update.update_text)}

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
          <Box sx={{ position: 'relative', mt: 1 }}>
            <TextField
              inputRef={textFieldRef}
              fullWidth
              multiline
              rows={4}
              value={editText}
              onChange={(e) => handleTextChange(e, true)}
              onKeyDown={(e) => handleMentionKeyDown(e, true)}
              placeholder="Enter your update... Type @ to mention users"
              variant="outlined"
            />
            {showMentions && filteredMentionUsers.length > 0 && (
              <ClickAwayListener onClickAway={() => setShowMentions(false)}>
                <Popper
                  open={showMentions}
                  anchorEl={mentionAnchorEl}
                  placement="bottom-start"
                  style={{ zIndex: 1300, width: mentionAnchorEl?.offsetWidth || 300 }}
                >
                  <Paper
                    elevation={4}
                    sx={{
                      maxHeight: 200,
                      overflow: 'auto',
                      mt: 1,
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <List dense>
                      {filteredMentionUsers.map((user, index) => (
                        <ListItem
                          key={user.id}
                          button
                          selected={index === selectedMentionIndex}
                          onClick={() => handleMentionSelect(user, true)}
                          sx={{
                            '&:hover': { backgroundColor: '#f5f5f5' },
                            '&.Mui-selected': { backgroundColor: '#e3f2fd' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={user.name}
                            secondary={`${user.role}${user.unit_section ? ` • ${user.unit_section}` : ''}`}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Popper>
              </ClickAwayListener>
            )}
          </Box>
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
