import React, { useEffect, useState } from 'react';
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
import { baseURL } from '../../config';

const AgentStatusTable = ({ dashboardData }) => {
  const [agents, setAgents] = useState(dashboardData?.agents || []);

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

  useEffect(() => {
    setAgents(dashboardData?.agents || []);
  }, [dashboardData?.agents]);

  useEffect(() => {
    let isMounted = true;

    const fetchAgents = async () => {
      try {
        const response = await fetch(`${baseURL}/users/agents`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch agents');
        const data = await response.json();
        const fetchedAgents = Array.isArray(data?.agents) ? data.agents : [];

        if (!isMounted) return;

        // Merge fetched status with existing metrics (calls/avgTime) if available
        setAgents((prevAgents) => {
          const prevById = new Map((prevAgents || []).map((a) => [a.id, a]));
          const merged = fetchedAgents.map((fa) => {
            const prev = prevById.get(fa.id);
            return {
              id: fa.id,
              name: fa.name || prev?.name || fa.email || 'Agent',
              status: fa.status || prev?.status || 'offline',
              calls: prev?.calls ?? 0,
              avgTime: prev?.avgTime ?? '0m 0s',
              satisfaction: prev?.satisfaction ?? 0,
            };
          });

          // Include any agents only present in prev (e.g., demo data), keep them at the end
          const fetchedIds = new Set(fetchedAgents.map((a) => a.id));
          (prevAgents || []).forEach((p) => {
            if (!fetchedIds.has(p.id)) merged.push(p);
          });

          return merged;
        });
      } catch (error) {
        // On error, keep existing state
        // console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Agent Status
        </Typography>
        <Chip
          label={`${(agents || []).filter((a) => a.status === 'online').length} Online`}
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
            {(agents || []).map((agent) => (
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
