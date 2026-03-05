import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  CallEnd,
  CallReceived
} from '@mui/icons-material';

const RecentCallsTable = ({ dashboardData }) => {
  const getStatusColor = (status) => {
    return status === 'completed' ? '#4caf50' : '#ff9800';
  };

  const getStatusIcon = (status) => {
    return status === 'completed' ? <CallEnd fontSize="small" /> : <CallReceived fontSize="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#2c3e50' }}>
        Recent Calls
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Caller</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dashboardData.recentCalls.map((call) => (
              <TableRow key={call.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: getStatusColor(call.status), width: 40, height: 40 }}>
                      {getStatusIcon(call.status)}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {call.number}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={call.status}
                    size="small"
                    color={call.status === 'completed' ? 'success' : 'warning'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>{call.duration}</TableCell>
                <TableCell>{call.agent}</TableCell>
                <TableCell>{call.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RecentCallsTable;
