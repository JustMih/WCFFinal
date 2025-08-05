import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Button,
  Collapse,
  Typography,
  IconButton,
  Divider,
  Chip,
  Modal,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  FaFilter, 
  FaChevronDown, 
  FaChevronUp, 
  FaUndo, 
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import './TicketFilters.css';

const TicketFilters = ({ onFilterChange, initialFilters, compact = false }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFilterChange = (field, value) => {
    onFilterChange({
      ...initialFilters,
      [field]: value
    });
  };

  const handleReset = () => {
    onFilterChange({
      search: "",
      nidaSearch: "",
      status: "",
      priority: "",
      category: "",
      startDate: null,
      endDate: null
    });
  };

  // Count active filters
  const activeFiltersCount = Object.values(initialFilters).filter(value => 
    value && value !== "" && value !== null
  ).length;

  if (compact) {
    return (
      <>
        <Box sx={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<FaFilter />}
            endIcon={<FaChevronDown />}
            onClick={() => setShowModal(true)}
            sx={{
              minWidth: 'auto',
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              height: '32px',
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                color="secondary"
                sx={{ 
                  ml: 1, 
                  height: '16px', 
                  fontSize: '0.6rem',
                  minWidth: '16px',
                  backgroundColor: '#fff',
                  color: '#1976d2'
                }}
              />
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="text"
              size="small"
              startIcon={<FaUndo />}
              onClick={handleReset}
              sx={{
                minWidth: 'auto',
                px: 1,
                py: 0.5,
                fontSize: '0.75rem',
                height: '32px',
                color: '#666'
              }}
            >
              Reset
            </Button>
          )}
        </Box>

        {/* Filter Modal */}
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          aria-labelledby="filter-modal-title"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              width: 320,
              maxHeight: '80vh',
              bgcolor: 'background.paper',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                Filter Tickets
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {activeFiltersCount > 0 && (
                  <Chip
                    label={activeFiltersCount}
                    size="small"
                    color="primary"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
                <IconButton
                  onClick={() => setShowModal(false)}
                  size="small"
                  sx={{ color: '#666' }}
                >
                  <FaTimes />
                </IconButton>
              </Box>
            </Box>

            {/* Filter Content */}
            <Box sx={{ p: 2 }}>
              {/* Quick Filters */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, color: '#333' }}>
                  Quick Filters
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    select
                    label="Status"
                    value={initialFilters.status || ""}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="Open">Open</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Closed">Closed</MenuItem>
                    <MenuItem value="Escalated">Escalated</MenuItem>
                  </TextField>
                  
                  <TextField
                    select
                    label="Priority"
                    value={initialFilters.priority || ""}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">All Priority</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Advanced Filters */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, color: '#333' }}>
                  Advanced Filters
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    select
                    label="Category"
                    value={initialFilters.category || ""}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="Inquiry">Inquiry</MenuItem>
                    <MenuItem value="Suggestion">Suggestion</MenuItem>
                    <MenuItem value="Complement">Complement</MenuItem>
                    <MenuItem value="Complaint">Complaint</MenuItem>
                  </TextField>
                  
                  <TextField
                    select
                    label="Channel"
                    value={initialFilters.channel || ""}
                    onChange={(e) => handleFilterChange('channel', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">All Channels</MenuItem>
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="Phone">Phone</MenuItem>
                    <MenuItem value="Web">Web</MenuItem>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                  </TextField>
                  
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={initialFilters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          size="small" 
                          fullWidth 
                          InputLabelProps={{ shrink: true }}
                          placeholder="Select start date..."
                        />
                      )}
                    />
                  </LocalizationProvider>
                  
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={initialFilters.endDate}
                      onChange={(date) => handleFilterChange('endDate', date)}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          size="small" 
                          fullWidth 
                          InputLabelProps={{ shrink: true }}
                          placeholder="Select end date..."
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<FaUndo />}
                  size="small"
                  sx={{ flex: 1 }}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setShowModal(false)}
                  size="small"
                  sx={{ flex: 1 }}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      </>
    );
  }

  return (
    <Paper sx={{ 
      p: 2, 
      mb: 2, 
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
      borderRadius: 2,
      border: '1px solid #e0e0e0'
    }}>
      {/* Header Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            Filter Tickets
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              label={activeFiltersCount}
              size="small"
              color="primary"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<FaUndo />}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FaFilter />}
            endIcon={showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced Filters
          </Button>
        </Box>
      </Box>

      {/* Quick Filters */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#333' }}>
          Quick Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Status"
              value={initialFilters.status || ""}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Open">Open</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
              <MenuItem value="Escalated">Escalated</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Priority"
              value={initialFilters.priority || ""}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">All Priority</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Advanced Filters - Collapsible */}
      <Collapse in={showAdvanced}>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ 
          pt: 2,
          backgroundColor: '#fafafa',
          p: 2,
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>
            Advanced Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Category"
                value={initialFilters.category || ""}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Inquiry">Inquiry</MenuItem>
                <MenuItem value="Suggestion">Suggestion</MenuItem>
                <MenuItem value="Complement">Complement</MenuItem>
                <MenuItem value="Complaint">Complaint</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Channel"
                value={initialFilters.channel || ""}
                onChange={(e) => handleFilterChange('channel', e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">All Channels</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="Phone">Phone</MenuItem>
                <MenuItem value="Web">Web</MenuItem>
                <MenuItem value="Social Media">Social Media</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={initialFilters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      size="small" 
                      fullWidth 
                      InputLabelProps={{ shrink: true }}
                      placeholder="Select start date..."
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={initialFilters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      size="small" 
                      fullWidth 
                      InputLabelProps={{ shrink: true }}
                      placeholder="Select end date..."
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default TicketFilters; 