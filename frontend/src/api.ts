"use client";

import axios from "axios";

export const isDevelopment = process.env.NODE_ENV === "development";
export const baseUrl = isDevelopment
  ? "http://localhost:8153/api"
  : "/api";

export const api = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);