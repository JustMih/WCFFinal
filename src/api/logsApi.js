import axios from "axios";
import { baseURL } from "config";

const API_BASE_URL = baseURL;     

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export async function fetchHttpLogs(params) {
  const response = await api.get("/logs/http", { params });
  return response.data;
}

export async function fetchAuditLogs(params) {
  const response = await api.get("/logs/audit", { params });
  return response.data;
}

const EXPORT_REQUEST_TIMEOUT_MS = 90000;

export async function fetchAuditLogsExport(params, signal) {
  try {
    const response = await api.get("/logs/audit/export", {
      params,
      timeout: EXPORT_REQUEST_TIMEOUT_MS,
      signal,
    });
    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      const timeoutError = new Error(
        "Export timed out — narrow the date range or export current page."
      );
      timeoutError.isExportTimeout = true;
      throw timeoutError;
    }
    throw error;
  }
}

