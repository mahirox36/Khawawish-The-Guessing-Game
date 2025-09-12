import { Moon, Sun, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [performance, setPerformance] = useState<boolean>(
    localStorage.performance === "true"
  );

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      updateTheme(e.matches);
    };

    darkModeMediaQuery.addEventListener("change", handleChange);
    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  }, []);

  const updateTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    updateTheme(!isDark);
  };

  const togglePerformance = () => {
    setPerformance((prev) => {
      localStorage.performance = (!prev).toString();
      return !prev;
    });
  };

  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2">
      <motion.button
        onClick={toggleDarkMode}
        className="p-2 rounded-full bg-game-surface-light dark:bg-game-surface-dark 
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
            <Moon className="w-6 h-6 text-game-accent" />
          ) : (
            <Sun className="w-6 h-6 text-game-primary" />
          )}
        </motion.div>
      </motion.button>
      <motion.button
        onClick={togglePerformance}
        className="p-2 rounded-full bg-game-surface-light dark:bg-game-surface-dark 
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
            <Sparkles className="w-6 h-6 text-game-accent" />
          ) : (
            <Sparkles className="w-6 h-6 text-game-primary" />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}
