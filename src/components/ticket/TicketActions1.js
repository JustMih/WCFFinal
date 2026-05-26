import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { FaEllipsisV, FaPaperclip } from 'react-icons/fa';

const TicketActions = ({ ticket, onStatusUpdate, onPriorityChange, onFileUpload, onFileDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [comment, setComment] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus) => {
    onStatusUpdate(ticket.id, newStatus);
    handleMenuClose();
  };

  const handlePriorityChange = (priority) => {
    onPriorityChange(ticket.id, priority);
    handleMenuClose();
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    // Handle comment submission
    setShowCommentDialog(false);
    setComment('');
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileSubmit = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('ticketId', ticket.id);
      await onFileUpload(formData);
      setShowFileDialog(false);
      setSelectedFile(null);
    }
  };

  return (
    <>
      <IconButton onClick={handleMenuClick}>
        <FaEllipsisV />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleStatusChange('Open')}>Mark as Open</MenuItem>
        <MenuItem onClick={() => handleStatusChange('In Progress')}>Mark as In Progress</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Closed')}>Mark as Closed</MenuItem>
        <MenuItem onClick={() => handlePriorityChange('High')}>Set Priority: High</MenuItem>
        <MenuItem onClick={() => handlePriorityChange('Medium')}>Set Priority: Medium</MenuItem>
        <MenuItem onClick={() => handlePriorityChange('Low')}>Set Priority: Low</MenuItem>
        <MenuItem onClick={() => {
          setShowCommentDialog(true);
          handleMenuClose();
        }}>Add Comment</MenuItem>
        <MenuItem onClick={() => {
          setShowFileDialog(true);
          handleMenuClose();
        }}>Attach File</MenuItem>
      </Menu>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onClose={() => setShowCommentDialog(false)}>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCommentDialog(false)}>Cancel</Button>
          <Button onClick={handleCommentSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={showFileDialog} onClose={() => setShowFileDialog(false)}>
        <DialogTitle>Attach File</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<FaPaperclip />}
              >
                Choose File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFileDialog(false)}>Cancel</Button>
          <Button
            onClick={handleFileSubmit}
            variant="contained"
            disabled={!selectedFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TicketActions; 