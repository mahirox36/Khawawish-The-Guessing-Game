"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginError } from "@/types";

interface LoginProps {
  onSuccess: () => void;
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

export function Login({
  onSuccess,
  username,
  setUsername,
  password,
  setPassword,
}: LoginProps) {
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      onSuccess();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "detail" in err) {
        const loginError = err as LoginError;
        setError(`Login failed. ${loginError.detail}`);
        return;
      }
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Username/Email
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 dark:focus:ring-secondary-500 focus:border-transparent
                   transition-colors duration-200"
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 dark:focus:ring-secondary-500 focus:border-transparent
                   transition-colors duration-200"
          required
        />
      </div>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white
                 bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90
                 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Sign in
      </button>
    </form>
  );
}
