// Apiinterceptor.js
import axios from "axios";

const server = "http://localhost:8000";

const api = axios.create({
  baseURL: server,
  withCredentials: true,
});

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

let isRefreshing = false;
let isRefreshingCSRFToken = false;

let failedQueue = [];
let CSRFfailedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve();
  });
  failedQueue = [];
};

const CSRFprocessQueue = (error) => {
  CSRFfailedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve();
  });
  CSRFfailedQueue = [];
};

//////////////////////////////////////////////////////
//// REQUEST INTERCEPTOR → attach csrf token
//////////////////////////////////////////////////////

api.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();

    if (["post", "put", "delete", "patch"].includes(method)) {
      const csrfToken = getCookie("csrfToken");
      if (csrfToken) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

//////////////////////////////////////////////////////
//// RESPONSE INTERCEPTOR → refresh tokens
//////////////////////////////////////////////////////

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 403 &&
      !originalRequest._retry &&
      originalRequest.url !== "/api/auth/refresh"
    ) {
      const errorCode = error.response.data?.code || "";

      /////////////////////////////////////////////
      // CSRF TOKEN EXPIRED
      /////////////////////////////////////////////
      if (errorCode.startsWith("CSRF_")) {
        if (isRefreshingCSRFToken) {
          return new Promise((resolve, reject) => {
            CSRFfailedQueue.push({ resolve, reject });
          }).then(() => api(originalRequest));
        }

        originalRequest._retry = true;
        isRefreshingCSRFToken = true;

        try {
          await api.post("/api/auth/refresh-csrf");
          CSRFprocessQueue(null);
          return api(originalRequest);
        } catch (err) {
          CSRFprocessQueue(err);
          return Promise.reject(err);
        } finally {
          isRefreshingCSRFToken = false;
        }
      }

      /////////////////////////////////////////////
      // ACCESS TOKEN EXPIRED
      /////////////////////////////////////////////

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/api/auth/refresh");
        processQueue(null);
        return api(originalRequest);
      } catch (err) {
        processQueue(err);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
