import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import {
  Phone,
  CallReceived,
  AccessTime,
  Speed
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const MetricCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  color: 'white',
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
}));

const MetricsCards = ({ dashboardData }) => {
  const metrics = [
    {
      title: 'Total Calls Today',
      value: dashboardData.totalCalls.toLocaleString(),
      icon: <Phone sx={{ fontSize: 50, opacity: 0.8 }} />
    },
    {
      title: 'Active Calls',
      value: dashboardData.activeCalls,
      icon: <CallReceived sx={{ fontSize: 50, opacity: 0.8 }} />
    },
    {
      title: 'Waiting Calls',
      value: dashboardData.waitingCalls,
      icon: <AccessTime sx={{ fontSize: 50, opacity: 0.8 }} />
    },
    {
      title: 'Avg Call Duration',
      value: dashboardData.avgCallDuration,
      icon: <Speed sx={{ fontSize: 50, opacity: 0.8 }} />
    }
  ];

  return (
    <Grid container spacing={4} sx={{ mb: 4 }}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} md={3} xl={3} key={index}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {metric.title}
                  </Typography>
                </Box>
                {metric.icon}
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default MetricsCards; 