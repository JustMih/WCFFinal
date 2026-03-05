import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// API endpoints
const USER_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  ROLES: '/roles',
  DEPARTMENTS: '/departments',
  SECTIONS: '/sections',
  PROFILE: '/profile'
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
      localStorage.removeItem('userId');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ===== AUTHENTICATION QUERIES =====

// Get current user profile
export const useCurrentUser = (options = {}) => {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: async () => {
      const response = await api.get(`${USER_ENDPOINTS.PROFILE}/me`);
      return response.data;
    },
    enabled: !!localStorage.getItem('token'),
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
    ...options
  });
};

// Get user by ID
export const useUser = (userId, options = {}) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.get(`${USER_ENDPOINTS.USERS}/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 300000, // 5 minutes
    ...options
  });
};

// Get all users
export const useUsers = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await api.get(USER_ENDPOINTS.USERS, { params: filters });
      return response.data;
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
    ...options
  });
};

// Get users by role
export const useUsersByRole = (role, options = {}) => {
  return useQuery({
    queryKey: ['users', 'role', role],
    queryFn: async () => {
      const response = await api.get(`${USER_ENDPOINTS.USERS}/role/${role}`);
      return response.data;
    },
    enabled: !!role,
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
    ...options
  });
};

// Get users by department
export const useUsersByDepartment = (department, options = {}) => {
  return useQuery({
    queryKey: ['users', 'department', department],
    queryFn: async () => {
      const response = await api.get(`${USER_ENDPOINTS.USERS}/department/${department}`);
      return response.data;
    },
    enabled: !!department,
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
    ...options
  });
};

// Get users by section
export const useUsersBySection = (section, options = {}) => {
  return useQuery({
    queryKey: ['users', 'section', section],
    queryFn: async () => {
      const response = await api.get(`${USER_ENDPOINTS.USERS}/section/${section}`);
      return response.data;
    },
    enabled: !!section,
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
    ...options
  });
};

// Get all roles
export const useRoles = (options = {}) => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get(USER_ENDPOINTS.ROLES);
      return response.data;
    },
    staleTime: 600000, // 10 minutes
    refetchInterval: 1800000, // 30 minutes
    ...options
  });
};

// Get all departments
export const useDepartments = (options = {}) => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get(USER_ENDPOINTS.DEPARTMENTS);
      return response.data;
    },
    staleTime: 600000, // 10 minutes
    refetchInterval: 1800000, // 30 minutes
    ...options
  });
};

// Get all sections
export const useSections = (options = {}) => {
  return useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await api.get(USER_ENDPOINTS.SECTIONS);
      return response.data;
    },
    staleTime: 600000, // 10 minutes
    refetchInterval: 1800000, // 30 minutes
    ...options
  });
};

// ===== AUTHENTICATION MUTATIONS =====

// Login
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post(`${USER_ENDPOINTS.AUTH}/login`, credentials);
      return response.data;
    },
    onSuccess: (data) => {
      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('userId', data.user.id);
      
      // Set current user in cache
      queryClient.setQueryData(['user', 'current'], data.user);
      
      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error) => {
      console.error('Login error:', error);
    }
  });
};

// Logout
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post(`${USER_ENDPOINTS.AUTH}/logout`);
      return response.data;
    },
    onSuccess: () => {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      
      // Clear all queries from cache
      queryClient.clear();
      
      // Redirect to login
      window.location.href = '/';
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      queryClient.clear();
      window.location.href = '/';
    }
  });
};

// Register
export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData) => {
      const response = await api.post(`${USER_ENDPOINTS.AUTH}/register`, userData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'role'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'department'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'section'] });
    },
    onError: (error) => {
      console.error('Registration error:', error);
    }
  });
};

// ===== USER MANAGEMENT MUTATIONS =====

// Create user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData) => {
      const response = await api.post(USER_ENDPOINTS.USERS, userData);
      return response.data;
    },
    onSuccess: (data) => {
      // Add new user to cache
      queryClient.setQueryData(['user', data.id], data);
      
      // Invalidate users lists
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'role'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'department'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'section'] });
    },
    onError: (error) => {
      console.error('Error creating user:', error);
    }
  });
};

// Update user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, updateData }) => {
      const response = await api.put(`${USER_ENDPOINTS.USERS}/${userId}`, updateData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { userId } = variables;
      
      // Update user in cache
      queryClient.setQueryData(['user', userId], data);
      
      // Update current user if it's the same user
      const currentUser = queryClient.getQueryData(['user', 'current']);
      if (currentUser && currentUser.id === userId) {
        queryClient.setQueryData(['user', 'current'], data);
      }
      
      // Invalidate users lists
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'role'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'department'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'section'] });
    },
    onError: (error) => {
      console.error('Error updating user:', error);
    }
  });
};

// Delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`${USER_ENDPOINTS.USERS}/${userId}`);
      return response.data;
    },
    onSuccess: (data, userId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['user', userId] });
      
      // Invalidate users lists
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'role'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'department'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'section'] });
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
    }
  });
};

// Change password
export const useChangePassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const response = await api.post(`${USER_ENDPOINTS.AUTH}/change-password`, {
        currentPassword,
        newPassword
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate current user to refresh data
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] });
    },
    onError: (error) => {
      console.error('Error changing password:', error);
    }
  });
};

// Reset password
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const response = await api.post(`${USER_ENDPOINTS.AUTH}/reset-password`, { email });
      return response.data;
    },
    onError: (error) => {
      console.error('Error resetting password:', error);
    }
  });
};

// ===== UTILITY FUNCTIONS =====

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get user role
export const getUserRole = () => {
  return localStorage.getItem('role');
};

// Get user ID
export const getUserId = () => {
  return localStorage.getItem('userId');
};

// Check if user has specific role
export const hasRole = (requiredRole) => {
  const userRole = getUserRole();
  return userRole === requiredRole;
};

// Check if user has any of the required roles
export const hasAnyRole = (requiredRoles) => {
  const userRole = getUserRole();
  return requiredRoles.includes(userRole);
};

// Prefetch user data
export const prefetchUser = (queryClient, userId) => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.get(`${USER_ENDPOINTS.USERS}/${userId}`);
      return response.data;
    },
    staleTime: 300000,
  });
};

// Export API instance for direct use if needed
export { api }; 