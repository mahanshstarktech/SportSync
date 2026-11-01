import axios from "axios";

// ===============================
// DYNAMIC BASE URL
// ===============================
// Automatically picks up REACT_APP_API_URL, localhost, or production backend
export const BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5001"
    : "https://sportsyncbackend.onrender.com");

export const API_URL = `${BASE_URL.replace(/\/+$/, "")}/api`;

// ===============================
// AXIOS INSTANCE
// ===============================
const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ===============================
// REQUEST INTERCEPTOR
// ===============================
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

// ===============================
// RESPONSE INTERCEPTOR
// ===============================
API.interceptors.response.use(
  (res) => res,
  (error) => {
    // If backend returns a friendly message, preserve it
    return Promise.reject(error);
  }
);

export default API;
