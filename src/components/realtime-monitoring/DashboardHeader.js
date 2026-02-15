import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Wifi,
  WifiOff,
  Close
} from '@mui/icons-material';

const DashboardHeader = ({ connectionStatus, onClose }) => {
  return (
    <Box sx={{ p: 4, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h2" component="h1" sx={{ 
          fontWeight: 600, 
          fontSize: 40,
          color: '#2c3e50',
          display: 'flex',
          alignItems: 'center',
          gap: 3
        }}>
          <DashboardIcon sx={{ fontSize: 40, color: '#667eea' }} />
          Real-Time Call Center Monitor
        </Typography>
        
        {/* Connection Status and Close Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {connectionStatus.isConnected ? (
            <Chip
              icon={<Wifi />}
              label="Connected"
              color="success"
              size="medium"
              sx={{ fontSize: '1rem', padding: '8px 16px' }}
            />
          ) : (
            <Chip
              icon={<WifiOff />}
              label="Disconnected"
              color="error"
              size="medium"
              sx={{ fontSize: '1rem', padding: '8px 16px' }}
            />
          )}
          <Tooltip title="Back to Dashboard">
            <IconButton
              onClick={onClose}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: '#2c3e50',
                width: 56,
                height: 56,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <Close sx={{ fontSize: 28 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Status Alert */}
      <Alert severity="info" sx={{ mb: 3, fontSize: '1rem' }}>
        All systems operational • Last updated: {new Date().toLocaleTimeString()}
      </Alert>
    </Box>
  );
};

export default DashboardHeader; 