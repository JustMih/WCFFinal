import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API endpoints
const METRICS_ENDPOINTS = {
  AGENT_METRICS: '/agent-metrics',
  TICKET_METRICS: '/ticket-metrics',
  WORKFLOW_METRICS: '/workflow-metrics',
  SLA_METRICS: '/sla-metrics',
  PERFORMANCE_METRICS: '/performance-metrics',
  DASHBOARD: '/dashboard'
};

// Axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ===== AGENT METRICS QUERIES =====

// Get agent performance metrics
export const useAgentMetrics = (agentId, options = {}) => {
  return useQuery({
    queryKey: ['agent-metrics', agentId],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.AGENT_METRICS}/${agentId}`);
      return response.data;
    },
    enabled: !!agentId,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    ...options
  });
};

// Get all agents metrics
export const useAllAgentsMetrics = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['agent-metrics', 'all', filters],
    queryFn: async () => {
      const response = await api.get(METRICS_ENDPOINTS.AGENT_METRICS, { params: filters });
      return response.data;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    ...options
  });
};

// Get agent metrics by role
export const useAgentMetricsByRole = (role, options = {}) => {
  return useQuery({
    queryKey: ['agent-metrics', 'role', role],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.AGENT_METRICS}/role/${role}`);
      return response.data;
    },
    enabled: !!role,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    ...options
  });
};

// Get agent metrics by department
export const useAgentMetricsByDepartment = (department, options = {}) => {
  return useQuery({
    queryKey: ['agent-metrics', 'department', department],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.AGENT_METRICS}/department/${department}`);
      return response.data;
    },
    enabled: !!department,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    ...options
  });
};

// ===== TICKET METRICS QUERIES =====

// Get ticket statistics
export const useTicketMetrics = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['ticket-metrics', filters],
    queryFn: async () => {
      const response = await api.get(METRICS_ENDPOINTS.TICKET_METRICS, { params: filters });
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// Get ticket metrics by status
export const useTicketMetricsByStatus = (status, options = {}) => {
  return useQuery({
    queryKey: ['ticket-metrics', 'status', status],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.TICKET_METRICS}/status/${status}`);
      return response.data;
    },
    enabled: !!status,
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// Get ticket metrics by type
export const useTicketMetricsByType = (type, options = {}) => {
  return useQuery({
    queryKey: ['ticket-metrics', 'type', type],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.TICKET_METRICS}/type/${type}`);
      return response.data;
    },
    enabled: !!type,
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// Get ticket metrics by priority
export const useTicketMetricsByPriority = (priority, options = {}) => {
  return useQuery({
    queryKey: ['ticket-metrics', 'priority', priority],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.TICKET_METRICS}/priority/${priority}`);
      return response.data;
    },
    enabled: !!priority,
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// ===== WORKFLOW METRICS QUERIES =====

// Get workflow performance metrics
export const useWorkflowMetrics = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['workflow-metrics', filters],
    queryFn: async () => {
      const response = await api.get(METRICS_ENDPOINTS.WORKFLOW_METRICS, { params: filters });
      return response.data;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    ...options
  });
};

// Get workflow metrics by path
export const useWorkflowMetricsByPath = (workflowPath, options = {}) => {
  return useQuery({
    queryKey: ['workflow-metrics', 'path', workflowPath],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.WORKFLOW_METRICS}/path/${workflowPath}`);
      return response.data;
    },
    enabled: !!workflowPath,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    ...options
  });
};

// Get workflow stage metrics
export const useWorkflowStageMetrics = (stage, options = {}) => {
  return useQuery({
    queryKey: ['workflow-metrics', 'stage', stage],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.WORKFLOW_METRICS}/stage/${stage}`);
      return response.data;
    },
    enabled: !!stage,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    ...options
  });
};

// ===== SLA METRICS QUERIES =====

// Get SLA compliance metrics
export const useSLAMetrics = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['sla-metrics', filters],
    queryFn: async () => {
      const response = await api.get(METRICS_ENDPOINTS.SLA_METRICS, { params: filters });
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// Get SLA metrics by priority
export const useSLAMetricsByPriority = (priority, options = {}) => {
  return useQuery({
    queryKey: ['sla-metrics', 'priority', priority],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.SLA_METRICS}/priority/${priority}`);
      return response.data;
    },
    enabled: !!priority,
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// Get SLA metrics by type
export const useSLAMetricsByType = (type, options = {}) => {
  return useQuery({
    queryKey: ['sla-metrics', 'type', type],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.SLA_METRICS}/type/${type}`);
      return response.data;
    },
    enabled: !!type,
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// ===== PERFORMANCE METRICS QUERIES =====

// Get system performance metrics
export const usePerformanceMetrics = (options = {}) => {
  return useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const response = await api.get(METRICS_ENDPOINTS.PERFORMANCE_METRICS);
      return response.data;
    },
    staleTime: 15000, // 15 seconds
    refetchInterval: 60000, // 1 minute
    ...options
  });
};

// Get performance metrics by time range
export const usePerformanceMetricsByTimeRange = (startDate, endDate, options = {}) => {
  return useQuery({
    queryKey: ['performance-metrics', 'time-range', startDate, endDate],
    queryFn: async () => {
      const response = await api.get(METRICS_ENDPOINTS.PERFORMANCE_METRICS, {
        params: { startDate, endDate }
      });
      return response.data;
    },
    enabled: !!(startDate && endDate),
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// ===== DASHBOARD QUERIES =====

// Get comprehensive dashboard data
export const useDashboardData = (options = {}) => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get(METRICS_ENDPOINTS.DASHBOARD);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// Get dashboard data by role
export const useDashboardDataByRole = (role, options = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'role', role],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.DASHBOARD}/role/${role}`);
      return response.data;
    },
    enabled: !!role,
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// Get dashboard data by department
export const useDashboardDataByDepartment = (department, options = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'department', department],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.DASHBOARD}/department/${department}`);
      return response.data;
    },
    enabled: !!department,
    staleTime: 30000, // 30 seconds
    refetchInterval: 120000, // 2 minutes
    ...options
  });
};

// ===== REAL-TIME UPDATES =====

// Get real-time ticket count
export const useRealTimeTicketCount = (options = {}) => {
  return useQuery({
    queryKey: ['real-time', 'ticket-count'],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.TICKET_METRICS}/count/real-time`);
      return response.data;
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // 10 seconds
    ...options
  });
};

// Get real-time SLA alerts
export const useRealTimeSLAAlerts = (options = {}) => {
  return useQuery({
    queryKey: ['real-time', 'sla-alerts'],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.SLA_METRICS}/alerts/real-time`);
      return response.data;
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // 10 seconds
    ...options
  });
};

// Get real-time workflow status
export const useRealTimeWorkflowStatus = (options = {}) => {
  return useQuery({
    queryKey: ['real-time', 'workflow-status'],
    queryFn: async () => {
      const response = await api.get(`${METRICS_ENDPOINTS.WORKFLOW_METRICS}/status/real-time`);
      return response.data;
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // 10 seconds
    ...options
  });
};

// ===== MUTATIONS =====

// Update agent metrics
export const useUpdateAgentMetrics = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ agentId, metricsData }) => {
      const response = await api.put(`${METRICS_ENDPOINTS.AGENT_METRICS}/${agentId}`, metricsData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { agentId } = variables;
      
      // Update agent metrics in cache
      queryClient.setQueryData(['agent-metrics', agentId], data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['agent-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Error updating agent metrics:', error);
    }
  });
};

// Update ticket metrics
export const useUpdateTicketMetrics = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (metricsData) => {
      const response = await api.put(METRICS_ENDPOINTS.TICKET_METRICS, metricsData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['ticket-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['real-time'] });
    },
    onError: (error) => {
      console.error('Error updating ticket metrics:', error);
    }
  });
};

// ===== UTILITY FUNCTIONS =====

// Optimistic update helper for metrics
export const optimisticUpdateMetrics = (queryClient, queryKey, updater) => {
  queryClient.setQueryData(queryKey, updater);
};

// Prefetch metrics data
export const prefetchMetrics = (queryClient, queryKey, queryFn) => {
  queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 30000,
  });
};

// Export API instance for direct use if needed
export { api }; 