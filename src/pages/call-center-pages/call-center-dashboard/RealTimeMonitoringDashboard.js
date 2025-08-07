import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import realTimeMonitoringService from '../../../services/realTimeMonitoringService';

// Import components
import DashboardHeader from '../../../components/realtime-monitoring/DashboardHeader';
import MetricsCards from '../../../components/realtime-monitoring/MetricsCards';
import ChartsSection from '../../../components/realtime-monitoring/ChartsSection';
import AgentStatusCard from '../../../components/realtime-monitoring/AgentStatusCard';
import RecentCallsCard from '../../../components/realtime-monitoring/RecentCallsCard';

const RealTimeMonitoringDashboard = () => {
  // State for real-time data
  const [dashboardData, setDashboardData] = useState({
    totalCalls: 1247,
    activeCalls: 23,
    waitingCalls: 8,
    avgCallDuration: '4m 32s',
    avgWaitTime: '1m 45s',
    agentUtilization: 78,
    customerSatisfaction: 92,
    callVolume: [45, 52, 38, 67, 89, 76, 54, 43, 65, 78, 89, 67],
    callTypes: {
      inbound: 65,
      outbound: 25,
      internal: 10
    },
    agents: [
      { id: 1, name: 'Sarah Johnson', status: 'online', calls: 12, avgTime: '3m 45s', satisfaction: 95 },
      { id: 2, name: 'Mike Chen', status: 'busy', calls: 8, avgTime: '4m 12s', satisfaction: 88 },
      { id: 3, name: 'Emily Davis', status: 'online', calls: 15, avgTime: '3m 28s', satisfaction: 92 },
      { id: 4, name: 'David Wilson', status: 'offline', calls: 0, avgTime: '0m 0s', satisfaction: 0 },
      { id: 5, name: 'Lisa Brown', status: 'online', calls: 9, avgTime: '4m 56s', satisfaction: 89 }
    ],
    recentCalls: [
      { id: 1, number: '+1 (555) 123-4567', duration: '3m 45s', agent: 'Sarah Johnson', status: 'completed', time: '2 min ago' },
      { id: 2, number: '+1 (555) 234-5678', duration: '4m 12s', agent: 'Mike Chen', status: 'in-progress', time: '5 min ago' },
      { id: 3, number: '+1 (555) 345-6789', duration: '2m 30s', agent: 'Emily Davis', status: 'completed', time: '8 min ago' },
      { id: 4, number: '+1 (555) 456-7890', duration: '5m 18s', agent: 'Lisa Brown', status: 'completed', time: '12 min ago' }
    ]
  });

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0
  });

  // Notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Initialize real-time monitoring
  useEffect(() => {
    // Connect to real-time monitoring service
    realTimeMonitoringService.connect();

    // Subscribe to real-time events
    const unsubscribeDashboard = realTimeMonitoringService.subscribe('dashboard_update', (data) => {
      setDashboardData(prev => ({
        ...prev,
        ...data
      }));
    });

    const unsubscribeCallEvent = realTimeMonitoringService.subscribe('call_event', (data) => {
      handleCallEvent(data);
    });

    const unsubscribeAgentStatus = realTimeMonitoringService.subscribe('agent_status_change', (data) => {
      handleAgentStatusChange(data);
    });

    const unsubscribeAlert = realTimeMonitoringService.subscribe('alert', (data) => {
      showNotification(data.message, data.severity || 'info');
    });

    // Start simulation if not connected to real server
    if (!realTimeMonitoringService.getConnectionStatus().isConnected) {
      realTimeMonitoringService.simulateRealTimeData();
    }

    // Update connection status periodically
    const connectionInterval = setInterval(() => {
      setConnectionStatus(realTimeMonitoringService.getConnectionStatus());
    }, 1000);

    // Cleanup on unmount
    return () => {
      unsubscribeDashboard();
      unsubscribeCallEvent();
      unsubscribeAgentStatus();
      unsubscribeAlert();
      clearInterval(connectionInterval);
      realTimeMonitoringService.disconnect();
    };
  }, []);

  // Handle call events
  const handleCallEvent = (event) => {
    if (event.type === 'call_started') {
      setDashboardData(prev => ({
        ...prev,
        activeCalls: prev.activeCalls + 1,
        totalCalls: prev.totalCalls + 1
      }));

      // Add to recent calls
      const newCall = {
        id: Date.now(),
        number: event.phoneNumber,
        duration: '0m 0s',
        agent: `Agent ${event.agentId}`,
        status: 'in-progress',
        time: 'Just now'
      };

      setDashboardData(prev => ({
        ...prev,
        recentCalls: [newCall, ...prev.recentCalls.slice(0, 9)] // Keep only 10 most recent
      }));
    } else if (event.type === 'call_ended') {
      setDashboardData(prev => ({
        ...prev,
        activeCalls: Math.max(0, prev.activeCalls - 1)
      }));
    }
  };

  // Handle agent status changes
  const handleAgentStatusChange = (data) => {
    setDashboardData(prev => ({
      ...prev,
      agents: prev.agents.map(agent => 
        agent.id === data.agentId 
          ? { ...agent, status: data.status }
          : agent
      )
    }));
  };

  // Show notification
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Refresh dashboard
  const handleRefresh = () => {
    realTimeMonitoringService.requestDashboardData();
    showNotification('Dashboard refreshed', 'success');
  };

  // Handle close button
  const handleClose = () => {
    window.history.back();
  };

  return (
    <Box sx={{ 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'auto'
    }}>
      {/* Header */}
      <DashboardHeader 
        connectionStatus={connectionStatus}
        onClose={handleClose}
      />

      {/* Key Metrics */}
      <MetricsCards dashboardData={dashboardData} />

      {/* Charts Section */}
      <ChartsSection dashboardData={dashboardData} />

      {/* Agent Status and Performance */}
      <Grid container spacing={4}>
        {/* Agent Status */}
        <Grid item xs={12} lg={6}>
          <AgentStatusCard dashboardData={dashboardData} />
        </Grid>

        {/* Recent Calls */}
        <Grid item xs={12} lg={6}>
          <RecentCallsCard dashboardData={dashboardData} />
        </Grid>
      </Grid>

    

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RealTimeMonitoringDashboard; 