import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API endpoints
const TICKET_ENDPOINTS = {
  TICKETS: '/tickets',
  WORKFLOW: '/workflow',
  ASSIGNMENTS: '/ticket-assignments',
  COMMENTS: '/ticket-comments',
  ATTACHMENTS: '/attachments',
  METRICS: '/agent-metrics'
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

// ===== TICKET QUERIES =====

// Get all tickets with filters
export const useTickets = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const response = await api.get(TICKET_ENDPOINTS.TICKETS, { params: filters });
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    ...options
  });
};

// Get ticket by ID
export const useTicket = (ticketId, options = {}) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const response = await api.get(`${TICKET_ENDPOINTS.TICKETS}/${ticketId}`);
      return response.data;
    },
    enabled: !!ticketId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
    ...options
  });
};

// Get tickets by user role
export const useTicketsByRole = (userRole, options = {}) => {
  return useQuery({
    queryKey: ['tickets', 'role', userRole],
    queryFn: async () => {
      const response = await api.get(`${TICKET_ENDPOINTS.TICKETS}/role/${userRole}`);
      return response.data;
    },
    enabled: !!userRole,
    staleTime: 20000, // 20 seconds
    refetchInterval: 45000, // 45 seconds
    ...options
  });
};

// Get tickets by status
export const useTicketsByStatus = (status, options = {}) => {
  return useQuery({
    queryKey: ['tickets', 'status', status],
    queryFn: async () => {
      const response = await api.get(`${TICKET_ENDPOINTS.TICKETS}/status/${status}`);
      return response.data;
    },
    enabled: !!status,
    staleTime: 25000, // 25 seconds
    refetchInterval: 50000, // 50 seconds
    ...options
  });
};

// Get workflow details
export const useWorkflowDetails = (ticketId, options = {}) => {
  return useQuery({
    queryKey: ['workflow', ticketId],
    queryFn: async () => {
      const response = await api.get(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}`);
      return response.data;
    },
    enabled: !!ticketId,
    staleTime: 10000, // 10 seconds
    refetchInterval: 20000, // 20 seconds
    ...options
  });
};

// Get ticket assignments
export const useTicketAssignments = (ticketId, options = {}) => {
  return useQuery({
    queryKey: ['assignments', ticketId],
    queryFn: async () => {
      const response = await api.get(`${TICKET_ENDPOINTS.ASSIGNMENTS}/ticket/${ticketId}`);
      return response.data;
    },
    enabled: !!ticketId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
    ...options
  });
};

// ===== TICKET MUTATIONS =====

// Create ticket
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketData) => {
      const response = await api.post(TICKET_ENDPOINTS.TICKETS, ticketData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch tickets list
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'role'] });
      
      // Add new ticket to cache
      queryClient.setQueryData(['ticket', data.id], data);
      
      // Update any filtered queries
      queryClient.invalidateQueries({ queryKey: ['tickets', 'status'] });
    },
    onError: (error) => {
      console.error('Error creating ticket:', error);
    }
  });
};

// Update ticket
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, updateData }) => {
      const response = await api.put(`${TICKET_ENDPOINTS.TICKETS}/${ticketId}`, updateData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket in cache
      queryClient.setQueryData(['ticket', ticketId], data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['assignments', ticketId] });
    },
    onError: (error) => {
      console.error('Error updating ticket:', error);
    }
  });
};

// Delete ticket
export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketId) => {
      const response = await api.delete(`${TICKET_ENDPOINTS.TICKETS}/${ticketId}`);
      return response.data;
    },
    onSuccess: (data, ticketId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['ticket', ticketId] });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'role'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'status'] });
    },
    onError: (error) => {
      console.error('Error deleting ticket:', error);
    }
  });
};

// ===== WORKFLOW MUTATIONS =====

// Rate complaint
export const useRateComplaint = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, rating, complaintType }) => {
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/rate`, {
        rating,
        complaintType
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket and workflow data
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'role'] });
    }
  });
};

// Change ticket type
export const useChangeTicketType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, newType }) => {
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/change-type`, {
        newType
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket and workflow data
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });
};

// Assign ticket
export const useAssignTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, assigneeId, assigneeRole, notes }) => {
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/assign`, {
        assigneeId,
        assigneeRole,
        notes
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket, workflow, and assignments
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      queryClient.setQueryData(['assignments', ticketId], data.assignments);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'role'] });
    }
  });
};

// Attend ticket
export const useAttendTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, notes, status }) => {
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/attend`, {
        notes,
        status
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket and workflow data
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'status'] });
    }
  });
};

// Recommend ticket
export const useRecommendTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, recommendation, nextRole, notes }) => {
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/recommend`, {
        recommendation,
        nextRole,
        notes
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket and workflow data
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'role'] });
    }
  });
};

// Reverse ticket
export const useReverseTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, reason, previousRole, notes }) => {
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/reverse`, {
        reason,
        previousRole,
        notes
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket and workflow data
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'role'] });
    }
  });
};

// Upload evidence
export const useUploadEvidence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, evidenceFile, description }) => {
      const formData = new FormData();
      formData.append('evidence', evidenceFile);
      formData.append('description', description);
      
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket and workflow data
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });
};

// Approve ticket
export const useApproveTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, approvalNotes }) => {
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/approve`, {
        approvalNotes
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket and workflow data
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'status'] });
    }
  });
};

// Close ticket
export const useCloseTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, closureNotes, resolution }) => {
      const response = await api.post(`${TICKET_ENDPOINTS.WORKFLOW}/${ticketId}/close`, {
        closureNotes,
        resolution
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { ticketId } = variables;
      
      // Update ticket and workflow data
      queryClient.setQueryData(['ticket', ticketId], data.ticket);
      queryClient.setQueryData(['workflow', ticketId], data.workflow);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', 'role'] });
    }
  });
};

// ===== UTILITY FUNCTIONS =====

// Optimistic update helper
export const optimisticUpdate = (queryClient, queryKey, updater) => {
  queryClient.setQueryData(queryKey, updater);
};

// Prefetch helper
export const prefetchTicket = (queryClient, ticketId) => {
  queryClient.prefetchQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const response = await api.get(`${TICKET_ENDPOINTS.TICKETS}/${ticketId}`);
      return response.data;
    },
    staleTime: 30000,
  });
};

// Export API instance for direct use if needed
export { api }; 