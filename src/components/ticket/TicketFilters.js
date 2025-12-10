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
      region: "",
      ticketId: "",
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
              width: 280,
              maxHeight: '85vh',
              bgcolor: 'background.paper',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <Box sx={{ 
              p: 1, 
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                Filter Tickets
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {activeFiltersCount > 0 && (
                  <Chip
                    label={activeFiltersCount}
                    size="small"
                    color="primary"
                    sx={{ fontSize: '0.6rem', height: '20px' }}
                  />
                )}
                <IconButton
                  onClick={() => setShowModal(false)}
                  size="small"
                  sx={{ color: '#666', p: 0.5 }}
                >
                  <FaTimes />
                </IconButton>
              </Box>
            </Box>

            {/* Filter Content */}
            <Box sx={{ p: 1, flex: 1, overflowY: 'auto' }}>
              {/* Quick Filters */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.25, color: '#333', display: 'block' }}>
                  Quick Filters
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <TextField
                    select
                    label="Status"
                    value={initialFilters.status || ""}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        fontSize: '0.75rem',
                        backgroundColor: 'white',
                        px: 0.25,
                        color: 'rgba(0, 0, 0, 0.6)'
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        fontSize: '0.75rem',
                        '& fieldset': {
                          borderColor: '#ccc',
                        },
                        '&:hover fieldset': {
                          borderColor: '#999',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: '#1976d2',
                        },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
                    <MenuItem value="Open" sx={{ fontSize: '0.75rem' }}>Open</MenuItem>
                    <MenuItem value="In Progress" sx={{ fontSize: '0.75rem' }}>In Progress</MenuItem>
                    <MenuItem value="Closed" sx={{ fontSize: '0.75rem' }}>Closed</MenuItem>
                    <MenuItem value="Escalated" sx={{ fontSize: '0.75rem' }}>Escalated</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Advanced Filters */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight="bold" sx={{ mb: 0.25, color: '#333', display: 'block' }}>
                  Advanced Filters
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <TextField
                    label="Ticket ID"
                    value={initialFilters.ticketId || ""}
                    onChange={(e) => handleFilterChange('ticketId', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="Enter ticket ID..."
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        fontSize: '0.75rem',
                        backgroundColor: 'white',
                        px: 0.25,
                        color: 'rgba(0, 0, 0, 0.6)'
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        fontSize: '0.75rem',
                        '& fieldset': {
                          borderColor: '#ccc',
                        },
                        '&:hover fieldset': {
                          borderColor: '#999',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: '#1976d2',
                        },
                      },
                    }}
                  />
                  
                  <TextField
                    select
                    label="Region"
                    value={initialFilters.region || ""}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        fontSize: '0.75rem',
                        backgroundColor: 'white',
                        px: 0.25,
                        color: 'rgba(0, 0, 0, 0.6)'
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        fontSize: '0.75rem',
                        '& fieldset': {
                          borderColor: '#ccc',
                        },
                        '&:hover fieldset': {
                          borderColor: '#999',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: '#1976d2',
                        },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Regions</MenuItem>
                    <MenuItem value="HQ" sx={{ fontSize: '0.75rem' }}>HQ</MenuItem>
                    <MenuItem value="arusha" sx={{ fontSize: '0.75rem' }}>Arusha</MenuItem>
                    <MenuItem value="dar-es-salaam" sx={{ fontSize: '0.75rem' }}>Dar es Salaam</MenuItem>
                    <MenuItem value="dodoma" sx={{ fontSize: '0.75rem' }}>Dodoma</MenuItem>
                    <MenuItem value="geita" sx={{ fontSize: '0.75rem' }}>Geita</MenuItem>
                    <MenuItem value="iringa" sx={{ fontSize: '0.75rem' }}>Iringa</MenuItem>
                    <MenuItem value="kagera" sx={{ fontSize: '0.75rem' }}>Kagera</MenuItem>
                    <MenuItem value="katavi" sx={{ fontSize: '0.75rem' }}>Katavi</MenuItem>
                    <MenuItem value="kigoma" sx={{ fontSize: '0.75rem' }}>Kigoma</MenuItem>
                    <MenuItem value="kilimanjaro" sx={{ fontSize: '0.75rem' }}>Kilimanjaro</MenuItem>
                    <MenuItem value="lindi" sx={{ fontSize: '0.75rem' }}>Lindi</MenuItem>
                    <MenuItem value="Manyara" sx={{ fontSize: '0.75rem' }}>Manyara</MenuItem>
                    <MenuItem value="Mara" sx={{ fontSize: '0.75rem' }}>Mara</MenuItem>
                    <MenuItem value="Mbeya" sx={{ fontSize: '0.75rem' }}>Mbeya</MenuItem>
                    <MenuItem value="Morogoro" sx={{ fontSize: '0.75rem' }}>Morogoro</MenuItem>
                    <MenuItem value="Mtwara" sx={{ fontSize: '0.75rem' }}>Mtwara</MenuItem>
                    <MenuItem value="Mwanza" sx={{ fontSize: '0.75rem' }}>Mwanza</MenuItem>
                    <MenuItem value="Njombe" sx={{ fontSize: '0.75rem' }}>Njombe</MenuItem>
                    <MenuItem value="Pemba North" sx={{ fontSize: '0.75rem' }}>Pemba North</MenuItem>
                    <MenuItem value="Pemba South" sx={{ fontSize: '0.75rem' }}>Pemba South</MenuItem>
                    <MenuItem value="Pwani" sx={{ fontSize: '0.75rem' }}>Pwani</MenuItem>
                    <MenuItem value="Rukwa" sx={{ fontSize: '0.75rem' }}>Rukwa</MenuItem>
                    <MenuItem value="Ruvuma" sx={{ fontSize: '0.75rem' }}>Ruvuma</MenuItem>
                    <MenuItem value="Shinyanga" sx={{ fontSize: '0.75rem' }}>Shinyanga</MenuItem>
                    <MenuItem value="Simiyu" sx={{ fontSize: '0.75rem' }}>Simiyu</MenuItem>
                    <MenuItem value="Singida" sx={{ fontSize: '0.75rem' }}>Singida</MenuItem>
                    <MenuItem value="Songwe" sx={{ fontSize: '0.75rem' }}>Songwe</MenuItem>
                    <MenuItem value="Tabora" sx={{ fontSize: '0.75rem' }}>Tabora</MenuItem>
                    <MenuItem value="Tanga" sx={{ fontSize: '0.75rem' }}>Tanga</MenuItem>
                    <MenuItem value="Unguja North" sx={{ fontSize: '0.75rem' }}>Unguja North</MenuItem>
                    <MenuItem value="Unguja South" sx={{ fontSize: '0.75rem' }}>Unguja South</MenuItem>
                  </TextField>
                  
                  <TextField
                    select
                    label="Category"
                    value={initialFilters.category || ""}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ 
                      shrink: true,
                      sx: { 
                        fontSize: '0.75rem',
                        backgroundColor: 'white',
                        px: 0.25,
                        color: 'rgba(0, 0, 0, 0.6)'
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        fontSize: '0.75rem',
                        '& fieldset': {
                          borderColor: '#ccc',
                        },
                        '&:hover fieldset': {
                          borderColor: '#999',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: '#1976d2',
                        },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Categories</MenuItem>
                    <MenuItem value="Inquiry" sx={{ fontSize: '0.75rem' }}>Inquiry</MenuItem>
                    <MenuItem value="Suggestion" sx={{ fontSize: '0.75rem' }}>Suggestion</MenuItem>
                    <MenuItem value="Complement" sx={{ fontSize: '0.75rem' }}>Complement</MenuItem>
                    <MenuItem value="Complaint" sx={{ fontSize: '0.75rem' }}>Complaint</MenuItem>
                  </TextField>
                  
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={initialFilters.startDate}
                      onChange={(date) => handleFilterChange('startDate', date)}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          InputLabelProps: { 
                            shrink: true,
                            sx: { 
                              fontSize: '0.75rem',
                              backgroundColor: 'white',
                              px: 0.25,
                              color: 'rgba(0, 0, 0, 0.6)'
                            }
                          },
                          placeholder: "Select start date...",
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              height: '36px',
                              fontSize: '0.75rem',
                              '& fieldset': {
                                borderColor: '#ccc',
                              },
                              '&:hover fieldset': {
                                borderColor: '#999',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              '&.Mui-focused': {
                                color: '#1976d2',
                              },
                            },
                          }
                        }
                      }}
                    />
                  </LocalizationProvider>
                  
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={initialFilters.endDate}
                      onChange={(date) => handleFilterChange('endDate', date)}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          InputLabelProps: { 
                            shrink: true,
                            sx: { 
                              fontSize: '0.75rem',
                              backgroundColor: 'white',
                              px: 0.25,
                              color: 'rgba(0, 0, 0, 0.6)'
                            }
                          },
                          placeholder: "Select end date...",
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              height: '36px',
                              fontSize: '0.75rem',
                              '& fieldset': {
                                borderColor: '#ccc',
                              },
                              '&:hover fieldset': {
                                borderColor: '#999',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#1976d2',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              '&.Mui-focused': {
                                color: '#1976d2',
                              },
                            },
                          }
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Box>
              </Box>
            </Box>

            {/* Action Buttons - Fixed at bottom */}
            <Box sx={{ 
              p: 1, 
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              borderRadius: '0 0 8px 8px',
              display: 'flex',
              gap: 0.5,
              flexShrink: 0
            }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                startIcon={<FaUndo />}
                size="small"
                sx={{ 
                  flex: 1,
                  fontSize: '0.75rem',
                  py: 0.5,
                  minHeight: '36px'
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={() => setShowModal(false)}
                size="small"
                sx={{ 
                  flex: 1,
                  fontSize: '0.75rem',
                  py: 0.5,
                  minHeight: '36px'
                }}
              >
                Apply
              </Button>
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
          pt: 0,
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
                label="Ticket ID"
                value={initialFilters.ticketId || ""}
                onChange={(e) => handleFilterChange('ticketId', e.target.value)}
                size="small"
                fullWidth
                placeholder="Enter ticket ID..."
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Region"
                value={initialFilters.region || ""}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">All Regions</MenuItem>
                <MenuItem value="HQ">HQ</MenuItem>
                <MenuItem value="arusha">Arusha</MenuItem>
                <MenuItem value="dar-es-salaam">Dar es Salaam</MenuItem>
                <MenuItem value="dodoma">Dodoma</MenuItem>
                <MenuItem value="geita">Geita</MenuItem>
                <MenuItem value="iringa">Iringa</MenuItem>
                <MenuItem value="kagera">Kagera</MenuItem>
                <MenuItem value="katavi">Katavi</MenuItem>
                <MenuItem value="kigoma">Kigoma</MenuItem>
                <MenuItem value="kilimanjaro">Kilimanjaro</MenuItem>
                <MenuItem value="lindi">Lindi</MenuItem>
                <MenuItem value="manyara">Manyara</MenuItem>
                <MenuItem value="mara">Mara</MenuItem>
                <MenuItem value="mbeya">Mbeya</MenuItem>
                <MenuItem value="morogoro">Morogoro</MenuItem>
                <MenuItem value="mtwara">Mtwara</MenuItem>
                <MenuItem value="mwanza">Mwanza</MenuItem>
                <MenuItem value="njombe">Njombe</MenuItem>
                <MenuItem value="pwani">Pwani</MenuItem>
                <MenuItem value="rukwa">Rukwa</MenuItem>
                <MenuItem value="ruvuma">Ruvuma</MenuItem>
                <MenuItem value="shinyanga">Shinyanga</MenuItem>
                <MenuItem value="simiyu">Simiyu</MenuItem>
                <MenuItem value="singida">Singida</MenuItem>
                <MenuItem value="songwe">Songwe</MenuItem>
                <MenuItem value="tabora">Tabora</MenuItem>
                <MenuItem value="tanga">Tanga</MenuItem>
                <MenuItem value="zanzibar-urban">Zanzibar Urban</MenuItem>
                <MenuItem value="zanzibar-rural">Zanzibar Rural</MenuItem>
                <MenuItem value="Unguja North">Unguja North</MenuItem>
                <MenuItem value="Unguja South">Unguja South</MenuItem>
              </TextField>
            </Grid>
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
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      InputLabelProps: { 
                        shrink: true,
                        sx: { 
                          backgroundColor: 'white',
                          px: 0.5,
                          color: 'rgba(0, 0, 0, 0.6)'
                        }
                      },
                      placeholder: "Select start date...",
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#999',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          '&.Mui-focused': {
                            color: '#1976d2',
                          },
                        },
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={initialFilters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      InputLabelProps: { 
                        shrink: true,
                        sx: { 
                          backgroundColor: 'white',
                          px: 0.5,
                          color: 'rgba(0, 0, 0, 0.6)'
                        }
                      },
                      placeholder: "Select end date...",
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#ccc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#999',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          '&.Mui-focused': {
                            color: '#1976d2',
                          },
                        },
                      }
                    }
                  }}
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