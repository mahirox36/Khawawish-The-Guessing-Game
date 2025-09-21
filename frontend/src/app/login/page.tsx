"use client";

import { useEffect, useState } from "react";
import { Login } from "@/components/Login";
import { Register } from "@/components/Register";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

export default function LoginPage() {
  const { handleAuthSuccess } = useGame();
  const { token, authReady } = useAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (authReady && token) {
      router.replace("/rooms");
    }
  }, [authReady, token, router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      {!authReady || token ? (
        <Spinner/>
      ) : (
        <>
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="max-w-md w-full space-y-8"
          >
            <div>
              <motion.h1
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-center text-4xl font-extrabold tracking-tight text-gradient dark:text-white"
              >
                Khawawish
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 text-center text-xl text-gray-600 dark:text-gray-400"
              >
                Join the Game
              </motion.h2>
            </div>

            <div className="mt-8 bg-white/50 dark:bg-gray-800/50 p-8 rounded-xl shadow-xl backdrop-blur-sm">
              <div className="flex justify-center space-x-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAuthMode("login")}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors
                  ${
                    authMode === "login"
                      ? "bg-primary-500 text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Login
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAuthMode("register")}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors
                  ${
                    authMode === "register"
                      ? "bg-primary-500 text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Register
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={authMode}
                  initial={{ opacity: 0, x: authMode === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: authMode === "login" ? 20 : -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {authMode === "login" ? (
                    <Login
                      onSuccess={handleAuthSuccess}
                      username={username}
                      setUsername={setUsername}
                      password={password}
                      setPassword={setPassword}
                    />
                  ) : (
                    <Register
                      onSuccess={handleAuthSuccess}
                      username={username}
                      setUsername={setUsername}
                      password={password}
                      setPassword={setPassword}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
