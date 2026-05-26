import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5070/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Instagram Management API
export const instagramApi = {
  // Get all Instagram data (comments and messages)
  getAllData: async (params = {}) => {
    try {
      const response = await api.get('/instagram-management/data', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Instagram data:', error);
      throw error;
    }
  },

  // Get Instagram statistics
  getStats: async () => {
    try {
      const response = await api.get('/instagram-management/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching Instagram stats:', error);
      throw error;
    }
  },

  // Mark comment as read
  markCommentAsRead: async (id) => {
    try {
      const response = await api.put(`/instagram-management/comments/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking comment as read:', error);
      throw error;
    }
  },

  // Mark message as read
  markMessageAsRead: async (id) => {
    try {
      const response = await api.put(`/instagram-management/messages/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // Reply to comment
  replyToComment: async (id, reply) => {
    try {
      const response = await api.post(`/instagram-management/comments/${id}/reply`, { reply });
      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  },

  // Reply to message
  replyToMessage: async (id, reply) => {
    try {
      const response = await api.post(`/instagram-management/messages/${id}/reply`, { reply });
      return response.data;
    } catch (error) {
      console.error('Error replying to message:', error);
      throw error;
    }
  },

  // Mark multiple items as read
  markMultipleAsRead: async (ids, type) => {
    try {
      const response = await api.put('/instagram-management/mark-multiple-read', { ids, type });
      return response.data;
    } catch (error) {
      console.error('Error marking multiple items as read:', error);
      throw error;
    }
  },

  // Instagram Posts Management
  // Create new Instagram post
  createPost: async (postData) => {
    try {
      const response = await api.post('/instagram-management/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating Instagram post:', error);
      throw error;
    }
  },

  // Get all Instagram posts
  getAllPosts: async (params = {}) => {
    try {
      const response = await api.get('/instagram-management/posts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      throw error;
    }
  },

  // Update Instagram post
  updatePost: async (id, postData) => {
    try {
      const response = await api.put(`/instagram-management/posts/${id}`, postData);
      return response.data;
    } catch (error) {
      console.error('Error updating Instagram post:', error);
      throw error;
    }
  },

  // Delete Instagram post
  deletePost: async (id) => {
    try {
      const response = await api.delete(`/instagram-management/posts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting Instagram post:', error);
      throw error;
    }
  },
};

export default instagramApi;
