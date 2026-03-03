import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';

const PerformanceMetricsCard = ({ dashboardData }) => {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c3e50', mb: 4 }}>
          Performance Metrics
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Agent Utilization</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {dashboardData.agentUtilization}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={dashboardData.agentUtilization} 
            sx={{ height: 12, borderRadius: 6 }}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Customer Satisfaction</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {dashboardData.customerSatisfaction}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={dashboardData.customerSatisfaction} 
            sx={{ height: 12, borderRadius: 6 }}
          />
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Average Wait Time</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {dashboardData.avgWaitTime}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={70} 
            sx={{ height: 12, borderRadius: 6 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetricsCard; 