import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Refresh,
  Settings,
  Notifications,
  SupervisorAccount
} from '@mui/icons-material';

const QuickActionsCard = ({ onRefresh, onNotification }) => {
  const actions = [
    {
      title: 'Refresh',
      icon: <Refresh sx={{ fontSize: 40 }} />,
      color: '#667eea',
      hoverColor: '#5a6fd8',
      onClick: onRefresh,
      tooltip: 'Refresh Dashboard'
    },
    {
      title: 'Settings',
      icon: <Settings sx={{ fontSize: 40 }} />,
      color: '#fa709a',
      hoverColor: '#e85a8a',
      onClick: () => console.log('Settings'),
      tooltip: 'Settings'
    },
    {
      title: 'Alerts',
      icon: (
        <Badge badgeContent={3} color="error">
          <Notifications sx={{ fontSize: 40 }} />
        </Badge>
      ),
      color: '#4facfe',
      hoverColor: '#3e9be8',
      onClick: onNotification,
      tooltip: 'Notifications'
    },
    {
      title: 'Supervisor',
      icon: <SupervisorAccount sx={{ fontSize: 40 }} />,
      color: '#a8edea',
      hoverColor: '#97dcd9',
      onClick: () => console.log('Supervisor'),
      tooltip: 'Supervisor Panel'
    }
  ];

  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c3e50', mb: 4 }}>
          Quick Actions
        </Typography>
        
        <Grid container spacing={3}>
          {actions.map((action, index) => (
            <Grid item xs={6} key={index}>
              <Tooltip title={action.tooltip}>
                <IconButton 
                  onClick={action.onClick}
                  sx={{ 
                    width: '100%', 
                    height: 100, 
                    bgcolor: action.color,
                    color: 'white',
                    '&:hover': { bgcolor: action.hoverColor }
                  }}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
              <Typography variant="body1" sx={{ display: 'block', textAlign: 'center', mt: 2, fontWeight: 600 }}>
                {action.title}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard; 