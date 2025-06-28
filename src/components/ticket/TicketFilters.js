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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FaFilter, FaChevronDown, FaChevronUp, FaUndo } from 'react-icons/fa';

const TicketFilters = ({ onFilterChange, initialFilters }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  return (
    <Paper sx={{ p: 2, mb: 2, boxShadow: 2, borderRadius: 2 }}>
      {/* Header Row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Filter Tickets
        </Typography>
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

  

      {/* Advanced Filters - Collapsible */}
      <Collapse in={showAdvanced}>
        <Box sx={{ pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Advanced Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Category"
                value={initialFilters.category || ""}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180}}
              >
                <MenuItem value="" disabled hidden>
                  Select Category
                </MenuItem>
                <MenuItem value="Inquiry">Inquiry</MenuItem>
                <MenuItem value="Suggestion">Suggestion</MenuItem>
                <MenuItem value="Complement">Complement</MenuItem>
                <MenuItem value="Complaint">Complaint</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                label="Channel"
                value={initialFilters.channel || ""}
                onChange={(e) => handleFilterChange('channel', e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180}}
              >
                <MenuItem value="" disabled hidden>
                  Select Channel
                </MenuItem>
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="Phone">Phone</MenuItem>
                <MenuItem value="Web">Web</MenuItem>
                <MenuItem value="Social Media">Social</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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