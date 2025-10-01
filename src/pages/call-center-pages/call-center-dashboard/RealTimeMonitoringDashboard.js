import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import realTimeMonitoringService from '../../../services/realTimeMonitoringService';
import { baseURL } from '../../../config';

// Import components
import DashboardHeader from '../../../components/realtime-monitoring/DashboardHeader';
import MetricsCards from '../../../components/realtime-monitoring/MetricsCards';
import ChartsSection from '../../../components/realtime-monitoring/ChartsSection';
import AgentStatusCard from '../../../components/realtime-monitoring/AgentStatusCard';
import RecentCallsCard from '../../../components/realtime-monitoring/RecentCallsCard';

const RealTimeMonitoringDashboard = () => {
  // Initial state (no dummy values)
  const [dashboardData, setDashboardData] = useState({
    totalCalls: 0,
    inboundCalls: 0,
    outboundCalls: 0,
    activeCalls: 0,
    waitingCalls: 0,
    avgCallDuration: '0m 0s',
    avgWaitTime: '0m 0s',
    agentUtilization: 0,
    customerSatisfaction: 0,
    callVolume: [],
    callTypes: {
      inbound: 0,
      outbound: 0,
      internal: 0
    },
    agents: [],
    recentCalls: []
  });

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0
  });

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    realTimeMonitoringService.connect();

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

    // Seed with API data on mount
    fetchInitialData();

    const connectionInterval = setInterval(() => {
      setConnectionStatus(realTimeMonitoringService.getConnectionStatus());
    }, 1000);

    return () => {
      unsubscribeDashboard();
      unsubscribeCallEvent();
      unsubscribeAgentStatus();
      unsubscribeAlert();
      clearInterval(connectionInterval);
      realTimeMonitoringService.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      // Calls counts and trends
      const countsRes = await fetch(`${baseURL}/calls/calls-count`);
      const counts = await countsRes.json();

      // Live calls (for recent calls approximation)
      const liveRes = await fetch(`${baseURL}/calls/live-calls`);
      const live = await liveRes.json();

      // Agents list
      const agentsRes = await fetch(`${baseURL}/users/agents`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const agentsData = await agentsRes.json();

      setDashboardData(prev => ({
        ...prev,
        callVolume: Array.isArray(counts?.monthlyCounts)
          ? counts.monthlyCounts.map(c => c.count)
          : prev.callVolume,
        callTypes: prev.callTypes, // update if you have an endpoint providing breakdown
        recentCalls: Array.isArray(live)
          ? live.map((c) => ({
              id: c.id || c.callId || `${c.caller}-${c.timestamp || Date.now()}`,
              number: c.caller || c.phoneNumber || 'Unknown',
              duration: c.duration || '0:00',
              agent: c.agentName || `Agent ${c.agentId || ''}`,
              status: c.status || 'in-progress',
              time: c.startTime || c.timestamp || '',
            }))
          : prev.recentCalls,
        agents: Array.isArray(agentsData?.agents) ? agentsData.agents : prev.agents,
      }));
    } catch (e) {
      // Keep defaults on failure
    }
  };

  const handleCallEvent = (event) => {
    if (event.type === 'call_started') {
      const isInbound = event.direction === 'inbound';

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
        activeCalls: prev.activeCalls + 1,
        totalCalls: prev.totalCalls + 1,
        inboundCalls: isInbound ? prev.inboundCalls + 1 : prev.inboundCalls,
        outboundCalls: !isInbound ? prev.outboundCalls + 1 : prev.outboundCalls,
        recentCalls: [newCall, ...prev.recentCalls.slice(0, 9)]
      }));
    } else if (event.type === 'call_ended') {
      setDashboardData(prev => ({
        ...prev,
        activeCalls: Math.max(0, prev.activeCalls - 1)
      }));
    }
  };

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

  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleRefresh = () => {
    realTimeMonitoringService.requestDashboardData();
    fetchInitialData();
    showNotification('Dashboard refreshed', 'success');
  };

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

      {/* Agent Status and Recent Calls */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={6}>
          <AgentStatusCard dashboardData={dashboardData} />
        </Grid>
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
