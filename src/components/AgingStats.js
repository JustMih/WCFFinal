import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Schedule,
  Warning,
  Error,
  CheckCircle
} from '@mui/icons-material';
import { baseURL } from '../config';

const AgingStats = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30');

  const fetchAgingStats = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${baseURL}/ticket/aging-stats/${userId}?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch aging statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgingStats();
  }, [userId, period]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Time':
        return '#4caf50';
      case 'Warning':
        return '#ff9800';
      case 'Overdue':
        return '#f44336';
      case 'Critical':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'On Time':
        return <CheckCircle />;
      case 'Warning':
        return <Warning />;
      case 'Overdue':
        return <Error />;
      case 'Critical':
        return <Error />;
      default:
        return <Schedule />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Assignment Aging Statistics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="7">7 days</MenuItem>
            <MenuItem value="30">30 days</MenuItem>
            <MenuItem value="60">60 days</MenuItem>
            <MenuItem value="90">90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Assignments
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.stats.total}
                  </Typography>
                </Box>
                <Schedule color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    On Time
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {stats.stats.onTime}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.stats.onTimePercent}%
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: '#4caf50' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Warning
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {stats.stats.warning}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.stats.warningPercent}%
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: '#ff9800' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Overdue/Critical
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                    {stats.stats.overdue + stats.stats.critical}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats.stats.overduePercent + stats.stats.criticalPercent}%
                  </Typography>
                </Box>
                <Error sx={{ fontSize: 40, color: '#f44336' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Average Days */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" />
                <Typography variant="body1">
                  Average Assignment Age: <strong>{stats.stats.averageDays} days</strong>
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1">
                  Period: <strong>{stats.period}</strong>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      {stats.recentAssignments && stats.recentAssignments.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Assignments
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {stats.recentAssignments.map((assignment, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1,
                    borderBottom: index < stats.recentAssignments.length - 1 ? '1px solid #eee' : 'none'
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Ticket #{assignment.ticket_id}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {assignment.category} {assignment.complaint_type ? `(${assignment.complaint_type})` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={assignment.aging_status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(assignment.aging_status),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {assignment.aging_formatted}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AgingStats; 