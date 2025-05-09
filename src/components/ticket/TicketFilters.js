import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Button,
  Collapse,
  IconButton,
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
    <Paper sx={{ p: 1, mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FaFilter />}
            endIcon={showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced Filters
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<FaUndo />}
            onClick={handleReset}
          >
            Reset
          </Button>
        </Box>
      </Box>

      <Collapse in={showAdvanced}>
        <Grid container spacing={2}>
          {/* <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              sx={{ width: '150px' }}
              label="Priority"
              value={initialFilters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              sx={{ width: '150px' }}
              label="Category"
              value={initialFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Technical">Technical</MenuItem>
              <MenuItem value="Billing">Billing</MenuItem>
              <MenuItem value="General">General</MenuItem>
            </TextField>
          </Grid> */}
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={initialFilters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} sx={{ width: '200px' }} size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={initialFilters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} sx={{ width: '200px' }} size="small" />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default TicketFilters; 