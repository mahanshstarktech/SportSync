import axios from "axios";

// ============================================================================
// DYNAMIC BASE URL
// ============================================================================
export const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5001"
    : "https://sportsyncbackend.onrender.com");

export const API_URL = `${BASE_URL.replace(/\/+$/, "")}/api`;

// ============================================================================
// AXIOS INSTANCE (PRODUCTION-GRADE TIMEOUT & CREDENTIALS)
// Set to 60s to accommodate free-tier cold starts on Render without aborting
// ============================================================================
const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Wake up Render free-tier instance asynchronously on client load
export const pingServer = () => {
  try {
    fetch(`${BASE_URL}/`, { method: "GET", mode: "no-cors" }).catch(() => {});
  } catch {
    // Non-blocking ping
  }
};

// ============================================================================
// REQUEST INTERCEPTOR: JWT AUTHORIZATION INJECTION
// ============================================================================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// RESPONSE INTERCEPTOR: AUTOMATIC TOKEN INVALIDATION & ERROR NORMALIZATION
// ============================================================================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server explicitly returns 401 Unauthorized, session has expired
    if (error.response && error.response.status === 401) {
      const isAuthRoute =
        typeof window !== "undefined" &&
        (window.location.pathname === "/" || window.location.pathname === "/register");

      if (!isAuthRoute) {
        console.warn("[Auth Security] Token expired or invalid. Clearing session.");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        localStorage.removeItem("sportsSelected");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
