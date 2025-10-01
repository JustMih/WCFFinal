import io from 'socket.io-client';
import { amiURL } from '../config';

class RealTimeMonitoringService {
  constructor() {
    this.socket = null;
    this.callbacks = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Initialize WebSocket connection
  connect(url = amiURL) {
    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventListeners();
      this.isConnected = true;
      console.log('Real-time monitoring service connected');
    } catch (error) {
      console.error('Failed to connect to real-time monitoring service:', error);
      this.isConnected = false;
    }
  }

  // Setup WebSocket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to real-time monitoring server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from real-time monitoring server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to real-time monitoring server after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to real-time monitoring server');
      this.isConnected = false;
    });

    // Handle real-time data updates
    this.socket.on('dashboard_update', (data) => {
      this.notifyCallbacks('dashboard_update', data);
    });

    this.socket.on('call_event', (data) => {
      this.notifyCallbacks('call_event', data);
    });

    this.socket.on('agent_status_change', (data) => {
      this.notifyCallbacks('agent_status_change', data);
    });

    this.socket.on('performance_metrics', (data) => {
      this.notifyCallbacks('performance_metrics', data);
    });

    this.socket.on('alert', (data) => {
      this.notifyCallbacks('alert', data);
    });
  }

  // Subscribe to real-time events
  subscribe(event, callback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Notify all callbacks for a specific event
  notifyCallbacks(event, data) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in callback for event', event, ':', error);
        }
      });
    }
  }

  // Emit events to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Request dashboard data
  requestDashboardData() {
    this.emit('get_dashboard_data');
  }

  // Request agent status
  requestAgentStatus() {
    this.emit('get_agent_status');
  }

  // Request performance metrics
  requestPerformanceMetrics() {
    this.emit('get_performance_metrics');
  }

  // Send agent action
  sendAgentAction(agentId, action) {
    this.emit('agent_action', { agentId, action });
  }

  // Send supervisor command
  sendSupervisorCommand(command, data) {
    this.emit('supervisor_command', { command, data });
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.callbacks.clear();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Simulate real-time data for development (when WebSocket is not available)
  simulateRealTimeData() {
    const simulateCallEvent = () => {
      const callEvents = [
        {
          type: 'call_started',
          callId: Math.random().toString(36).substr(2, 9),
          agentId: Math.floor(Math.random() * 5) + 1,
          phoneNumber: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          timestamp: new Date().toISOString(),
        },
        {
          type: 'call_ended',
          callId: Math.random().toString(36).substr(2, 9),
          agentId: Math.floor(Math.random() * 5) + 1,
          duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
          satisfaction: Math.floor(Math.random() * 20) + 80, // 80-100%
          timestamp: new Date().toISOString(),
        },
        {
          type: 'agent_status_change',
          agentId: Math.floor(Math.random() * 5) + 1,
          status: ['online', 'busy', 'offline'][Math.floor(Math.random() * 3)],
          timestamp: new Date().toISOString(),
        },
      ];

      const randomEvent = callEvents[Math.floor(Math.random() * callEvents.length)];
      this.notifyCallbacks('call_event', randomEvent);
    };

    // Simulate data every 3-8 seconds
    setInterval(simulateCallEvent, Math.random() * 5000 + 3000);

    // Simulate dashboard updates every 5 seconds
    setInterval(() => {
      const dashboardUpdate = {
        totalCalls: Math.floor(Math.random() * 10) + 1240,
        activeCalls: Math.floor(Math.random() * 10) + 20,
        waitingCalls: Math.floor(Math.random() * 5) + 5,
        agentUtilization: Math.floor(Math.random() * 10) + 75,
        customerSatisfaction: Math.floor(Math.random() * 5) + 90,
        timestamp: new Date().toISOString(),
      };
      this.notifyCallbacks('dashboard_update', dashboardUpdate);
    }, 5000);

    // Simulate performance metrics every 10 seconds
    setInterval(() => {
      const performanceMetrics = {
        avgCallDuration: `${Math.floor(Math.random() * 2) + 3}m ${Math.floor(Math.random() * 60)}s`,
        avgWaitTime: `${Math.floor(Math.random() * 2) + 1}m ${Math.floor(Math.random() * 60)}s`,
        callVolume: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 30),
        timestamp: new Date().toISOString(),
      };
      this.notifyCallbacks('performance_metrics', performanceMetrics);
    }, 10000);
  }
}

// Create singleton instance
const realTimeMonitoringService = new RealTimeMonitoringService();

export default realTimeMonitoringService; 