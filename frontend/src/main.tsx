import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import { Toaster } from "react-hot-toast";

// Check for dark mode preference
if (
  localStorage.theme === 'dark' || 
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Check for performance mode preference
if (
  localStorage.performance === true || 
  (!('performance' in localStorage) && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
) {
  document.documentElement.classList.add('performance');
} else {
  document.documentElement.classList.remove('performance');
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <Toaster position="bottom-right" />
      <App />
    </AuthProvider>
  </React.StrictMode>
);
