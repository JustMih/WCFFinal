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
  CallMade,
  AccessTime,
  Speed
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled card with gradient and animation
const MetricCard = styled(Card)(() => ({
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
      value: dashboardData.totalCalls?.toLocaleString() || '0',
      icon: <Phone sx={{ fontSize: 50, opacity: 0.8 }} />,
    },
    {
      title: 'Inbound Calls',
      value: dashboardData.inboundCalls?.toLocaleString() || '0',
      icon: <CallReceived sx={{ fontSize: 50, opacity: 0.8 }} />,
    },
    {
      title: 'Outbound Calls',
      value: dashboardData.outboundCalls?.toLocaleString() || '0',
      icon: <CallMade sx={{ fontSize: 50, opacity: 0.8 }} />,
    },
    {
      title: 'Active Calls',
      value: dashboardData.activeCalls?.toLocaleString() || '0',
      icon: <Phone sx={{ fontSize: 50, opacity: 0.8 }} />,
    },
    {
      title: 'Waiting Calls',
      value: dashboardData.waitingCalls?.toLocaleString() || '0',
      icon: <AccessTime sx={{ fontSize: 50, opacity: 0.8 }} />,
    },
    {
      title: 'Avg Call Duration',
      value: dashboardData.avgCallDuration || '0m 0s',
      icon: <Speed sx={{ fontSize: 50, opacity: 0.8 }} />,
    },
  ];

  return (
    <Box sx={{ width: '100%', px: 0, mt: 2 , mb: 4}}>
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <MetricCard>
              <CardContent sx={{ py: 2 }}> {/* Add top/bottom padding here */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
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
    </Box>
  );
};

export default MetricsCards;
