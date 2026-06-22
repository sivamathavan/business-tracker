import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

// ─── Simple In-Memory GET Cache (30s TTL) ───────────────────────────────────
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 30_000;

export const clearApiCache = () => cache.clear();

const getCached = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { cache.delete(key); return null; }
  return entry.data;
};

const setCache = (key: string, data: any) =>
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });

// ─── BroadcastChannel: instant cross-tab data sync ──────────────────────────
// When any tab makes a mutation, all other open tabs hear about it and can refresh.
const syncChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('tracker_data_sync')
  : null;

export const onDataSync = (handler: () => void) => {
  if (!syncChannel) return () => {};
  const listener = (e: MessageEvent) => {
    if (e.data?.type === 'DATA_CHANGED') handler();
  };
  syncChannel.addEventListener('message', listener);
  return () => syncChannel.removeEventListener('message', listener);
};
// ────────────────────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Cache GETs, clear cache + broadcast on mutations, handle 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();
    if (method === 'get' && response.config.url && response.data?.success !== false) {
      // Only cache successful responses (not error payloads)
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      setCache(cacheKey, response.data);
    } else if (['post', 'put', 'delete', 'patch'].includes(method || '')) {
      // Invalidate local cache and notify all other tabs instantly
      cache.clear();
      syncChannel?.postMessage({ type: 'DATA_CHANGED', timestamp: Date.now() });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/login' || originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data.success) {
          const newToken = refreshResponse.data.accessToken;
          useAuthStore.getState().setToken(newToken);
          processQueue(null, newToken);
          isRefreshing = false;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ─── Cached GET Helper ───────────────────────────────────────────────────────
export const cachedGet = async (url: string, params?: object) => {
  const cacheKey = `${url}${JSON.stringify(params || {})}`;
  const hit = getCached(cacheKey);
  if (hit) return { data: hit };
  return apiClient.get(url, { params });
};
