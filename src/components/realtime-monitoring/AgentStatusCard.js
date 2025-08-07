import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
} from '@mui/material';
import {
  Phone,
  PhoneDisabled,
  CallEnd,
} from '@mui/icons-material';

const AgentStatusTable = ({ dashboardData }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4caf50';
      case 'busy': return '#ff9800';
      case 'offline': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <Phone fontSize="small" />;
      case 'busy': return <PhoneDisabled fontSize="small" />;
      case 'offline': return <CallEnd fontSize="small" />;
      default: return <CallEnd fontSize="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Agent Status
        </Typography>
        <Chip
          label={`${dashboardData.agents.filter((a) => a.status === 'online').length} Online`}
          color="success"
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Agent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Calls</TableCell>
              <TableCell>Avg Time</TableCell>
              {/* <TableCell>Satisfaction</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {dashboardData.agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: getStatusColor(agent.status), width: 40, height: 40 }}>
                      {getStatusIcon(agent.status)}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {agent.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={agent.status}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(agent.status),
                      color: 'white',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                    }}
                  />
                </TableCell>
                <TableCell>{agent.calls}</TableCell>
                <TableCell>{agent.avgTime}</TableCell>
                {/* <TableCell>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="body2" color="textSecondary">
                      {agent.satisfaction}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={agent.satisfaction}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AgentStatusTable;
