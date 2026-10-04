import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

/**
 * Safely resolves the API Base URL with optional chaining, avoiding runtime crashes
 * if backend environment variables are missing at build or runtime.
 */
export const getApiBaseUrl = (): string => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    if (metaEnv?.VITE_API_URL) {
      return metaEnv.VITE_API_URL.replace(/\/$/, "");
    }
  } catch {
    // Non-Vite environment fallback
  }

  try {
    const procEnv = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })?.process?.env;
    if (procEnv?.VITE_API_URL) {
      return procEnv.VITE_API_URL.replace(/\/$/, "");
    }
  } catch {
    // Non-Node environment fallback
  }

  return "";
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to safely prevent unhandled promise rejections
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log warning rather than letting uncaught exceptions crash the whole application
    console.warn("API request failed:", error?.config?.url, error?.message || error);
    return Promise.reject(error);
  },
);

export default apiClient;
