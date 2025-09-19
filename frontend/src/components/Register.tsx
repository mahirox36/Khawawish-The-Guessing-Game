import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

import { motion } from "framer-motion";

interface RegisterProps {
  onSuccess: () => void;
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
}

export function Register({
  onSuccess,
  username,
  setUsername,
  password,
  setPassword,
}: RegisterProps) {
  const [formData, setFormData] = useState({
    username: username,
    email: "",
    password: password,
    display_name: "",
  });
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.display_name
      );
      onSuccess();
    } catch (err) {
      if (err && typeof err === "object" && "detail" in err) {
        const regError = err as { detail: string };
        setError(`Registration failed. ${regError.detail}`);
        return;
      }
      setError("Registration failed. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (e.target.name === "username") {
      setUsername(e.target.value);
    }
    if (e.target.name === "password") {
      setPassword(e.target.value);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Username
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 dark:focus:ring-secondary-500 focus:border-transparent
                   transition-colors duration-200"
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Email
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 dark:focus:ring-secondary-500 focus:border-transparent
                   transition-colors duration-200"
          required
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="display_name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Display Name
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          id="display_name"
          name="display_name"
          value={formData.display_name}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 dark:focus:ring-secondary-500 focus:border-transparent
                   transition-colors duration-200"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Password
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 dark:focus:ring-secondary-500 focus:border-transparent
                   transition-colors duration-200"
          required
        />
      </div>
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-3 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}
      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white
                 bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90
                 transform transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Create Account
      </motion.button>
    </motion.form>
  );
}
