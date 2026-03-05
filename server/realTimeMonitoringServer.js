const { Server } = require('socket.io');

class RealTimeMonitoringServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    
    this.clients = new Set();
    this.dashboardData = {
      totalCalls: 1247,
      activeCalls: 23,
      waitingCalls: 8,
      agentUtilization: 78,
      customerSatisfaction: 92,
      agents: [
        { id: 1, name: 'Sarah Johnson', status: 'online', calls: 12, avgTime: '3m 45s', satisfaction: 95 },
        { id: 2, name: 'Mike Chen', status: 'busy', calls: 8, avgTime: '4m 12s', satisfaction: 88 },
        { id: 3, name: 'Emily Davis', status: 'online', calls: 15, avgTime: '3m 28s', satisfaction: 92 },
        { id: 4, name: 'David Wilson', status: 'offline', calls: 0, avgTime: '0m 0s', satisfaction: 0 },
        { id: 5, name: 'Lisa Brown', status: 'online', calls: 9, avgTime: '4m 56s', satisfaction: 89 }
      ],
      recentCalls: []
    };

    this.setupEventHandlers();
    this.startDataSimulation();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected to real-time monitoring:', socket.id);
      this.clients.add(socket);

      // Send initial dashboard data
      socket.emit('dashboard_update', this.dashboardData);

      // Handle client requests
      socket.on('get_dashboard_data', () => {
        socket.emit('dashboard_update', this.dashboardData);
      });

      socket.on('get_agent_status', () => {
        socket.emit('agent_status_update', this.dashboardData.agents);
      });

      socket.on('get_performance_metrics', () => {
        const metrics = {
          avgCallDuration: '4m 32s',
          avgWaitTime: '1m 45s',
          callVolume: [45, 52, 38, 67, 89, 76, 54, 43, 65, 78, 89, 67],
          timestamp: new Date().toISOString()
        };
        socket.emit('performance_metrics', metrics);
      });

      socket.on('agent_action', (data) => {
        console.log('Agent action received:', data);
        this.handleAgentAction(data);
      });

      socket.on('supervisor_command', (data) => {
        console.log('Supervisor command received:', data);
        this.handleSupervisorCommand(data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected from real-time monitoring:', socket.id);
        this.clients.delete(socket);
      });
    });
  }

  handleAgentAction(data) {
    const { agentId, action } = data;
    
    switch (action) {
      case 'go_online':
        this.updateAgentStatus(agentId, 'online');
        break;
      case 'go_offline':
        this.updateAgentStatus(agentId, 'offline');
        break;
      case 'start_call':
        this.updateAgentStatus(agentId, 'busy');
        this.simulateCallStarted(agentId);
        break;
      case 'end_call':
        this.updateAgentStatus(agentId, 'online');
        this.simulateCallEnded(agentId);
        break;
      default:
        console.log('Unknown agent action:', action);
    }
  }

  handleSupervisorCommand(data) {
    const { command, data: commandData } = data;
    
    switch (command) {
      case 'broadcast_message':
        this.broadcastAlert(`Supervisor Message: ${commandData.message}`, 'info');
        break;
      case 'emergency_alert':
        this.broadcastAlert('EMERGENCY: All agents please check in immediately!', 'error');
        break;
      case 'system_maintenance':
        this.broadcastAlert('System maintenance scheduled in 10 minutes', 'warning');
        break;
      default:
        console.log('Unknown supervisor command:', command);
    }
  }

  updateAgentStatus(agentId, status) {
    const agent = this.dashboardData.agents.find(a => a.id === agentId);
    if (agent) {
      agent.status = status;
      this.broadcastToAll('agent_status_change', { agentId, status });
    }
  }

  simulateCallStarted(agentId) {
    const callEvent = {
      type: 'call_started',
      callId: Math.random().toString(36).substr(2, 9),
      agentId,
      phoneNumber: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      timestamp: new Date().toISOString()
    };

    this.dashboardData.activeCalls++;
    this.dashboardData.totalCalls++;

    this.broadcastToAll('call_event', callEvent);
    this.broadcastToAll('dashboard_update', {
      activeCalls: this.dashboardData.activeCalls,
      totalCalls: this.dashboardData.totalCalls
    });
  }

  simulateCallEnded(agentId) {
    const duration = Math.floor(Math.random() * 300) + 60; // 1-6 minutes
    const satisfaction = Math.floor(Math.random() * 20) + 80; // 80-100%

    const callEvent = {
      type: 'call_ended',
      callId: Math.random().toString(36).substr(2, 9),
      agentId,
      duration,
      satisfaction,
      timestamp: new Date().toISOString()
    };

    this.dashboardData.activeCalls = Math.max(0, this.dashboardData.activeCalls - 1);

    this.broadcastToAll('call_event', callEvent);
    this.broadcastToAll('dashboard_update', {
      activeCalls: this.dashboardData.activeCalls
    });
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  broadcastAlert(message, severity = 'info') {
    this.broadcastToAll('alert', { message, severity });
  }

  startDataSimulation() {
    // Simulate random call events
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every interval
        const agentId = Math.floor(Math.random() * 5) + 1;
        const agent = this.dashboardData.agents.find(a => a.id === agentId);
        
        if (agent && agent.status === 'online') {
          this.simulateCallStarted(agentId);
          
          // End call after random duration
          setTimeout(() => {
            this.simulateCallEnded(agentId);
          }, Math.random() * 300000 + 60000); // 1-6 minutes
        }
      }
    }, 10000); // Every 10 seconds

    // Simulate agent status changes
    setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance every interval
        const agentId = Math.floor(Math.random() * 5) + 1;
        const statuses = ['online', 'busy', 'offline'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        this.updateAgentStatus(agentId, newStatus);
      }
    }, 15000); // Every 15 seconds

    // Simulate performance metrics updates
    setInterval(() => {
      this.dashboardData.agentUtilization = Math.max(60, Math.min(95, 
        this.dashboardData.agentUtilization + (Math.random() > 0.5 ? 1 : -1)
      ));
      
      this.dashboardData.customerSatisfaction = Math.max(85, Math.min(98, 
        this.dashboardData.customerSatisfaction + (Math.random() > 0.5 ? 1 : -1)
      ));

      this.broadcastToAll('dashboard_update', {
        agentUtilization: this.dashboardData.agentUtilization,
        customerSatisfaction: this.dashboardData.customerSatisfaction
      });
    }, 20000); // Every 20 seconds
  }

  // Method to manually trigger events (for testing)
  triggerEvent(event, data) {
    this.broadcastToAll(event, data);
  }

  // Get current dashboard data
  getDashboardData() {
    return this.dashboardData;
  }

  // Update dashboard data manually
  updateDashboardData(newData) {
    this.dashboardData = { ...this.dashboardData, ...newData };
    this.broadcastToAll('dashboard_update', this.dashboardData);
  }
}

module.exports = RealTimeMonitoringServer; 