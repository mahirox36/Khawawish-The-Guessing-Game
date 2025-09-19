"use client";

import { Moon, Sun, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true; // SSR safe
    return localStorage.theme === "dark";
  });
  const [performance, setPerformance] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.performance === "true"
  });

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    updateTheme(isDark, performance);
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      updateTheme(e.matches, performance);
    };

    darkModeMediaQuery.addEventListener("change", handleChange);
    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTheme = (dark: boolean, performance: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
    if (performance){
      localStorage.performance = "true"
    } else {
      localStorage.performance = "false"
    }

  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    updateTheme(!isDark, performance);
  };

  const togglePerformance = () => {
    setPerformance((prev) => {
      localStorage.performance = (!prev).toString();
      return !prev;
    });
  };

  if (!mounted) return null;

  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2">
      <motion.button
        onClick={toggleDarkMode}
        className="p-2 rounded-full bg-surfacel-500 dark:bg-surfaced-500 
                  shadow-lg hover:shadow-xl transition-shadow duration-300"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        aria-label="Toggle dark mode"
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {isDark ? (
            <Moon className="w-6 h-6 text-accent-500" />
          ) : (
            <Sun className="w-6 h-6 text-primary-500" />
          )}
        </motion.div>
      </motion.button>
      <motion.button
        onClick={togglePerformance}
        className="p-2 rounded-full bg-surfacel-500 dark:bg-surfaced-500 
                  shadow-lg hover:shadow-xl transition-shadow duration-300"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        aria-label="Toggle performance mode"
      >
        <motion.div
          initial={false}
          animate={{ rotate: performance ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {performance ? (
            <Sparkles className="w-6 h-6 text-accent-500" />
          ) : (
            <Sparkles className="w-6 h-6 text-primary-500" />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}
