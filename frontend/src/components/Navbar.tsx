"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  // Trophy,
  LogOut,
  Eye,
  Moon,
  Sun,
  Sparkles,
  ChevronDown,
  Users,
  UserIcon,
} from "lucide-react";
import { User } from "@/types";
import NextImage from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

// Navigation link interface
interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Profile card props interface
interface ProfileCardProps {
  user: User;
  onShow: (username: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

// Profile Card Component
const ProfileCard: React.FC<ProfileCardProps> = ({
  user: user_profile,
  onShow,
  onLogout,
}) => {
  const displayName = user_profile.display_name || user_profile.username;
  const { user } = useAuth();
  const owned = user?.user_id === user_profile.user_id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full right-0 mt-2 w-80 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 shadow-2xl z-50"
    >
      {/* Banner */}
      <div className="relative h-20 rounded-xl overflow-hidden mb-4">
        {user_profile.banner_url ? (
          <NextImage
            src={user_profile.banner_url}
            alt="Profile banner"
            className="w-full h-full object-cover"
            unoptimized
            fill
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Info */}
      <div className="flex items-start gap-3 mb-4">
        <div className="relative">
          <div className="w-full h-full rounded-full border border-surfacel-500 dark:border-surfaced-500 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
            {user_profile.avatar_url ? (
              <NextImage
                src={user_profile.avatar_url}
                alt={displayName}
                className="w-15 h-15"
                unoptimized
                width={220}
                height={220}
              />
            ) : (
              <UserIcon size={45} className="text-gray-400" />
            )}
          </div>

          {user_profile.is_verified && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white">{displayName}</h3>
          <p className="text-xs text-white/70">@{user_profile.username}</p>
          {user_profile.bio && (
            <p className="text-xs text-white/60 mt-1 line-clamp-2">
              {user_profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-black/20 rounded-xl">
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {user_profile.games_won}
          </div>
          <div className="text-xs text-white/70">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {user_profile.win_rate.toFixed(1)}%
          </div>
          <div className="text-xs text-white/70">Win Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {user_profile.current_streak}
          </div>
          <div className="text-xs text-white/70">Streak</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onShow(user_profile.username)
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Profile
          </motion.button>
        {owned && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/80 hover:bg-red-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Dark Mode Toggle Component
export function DarkModeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true; // SSR safe
    return localStorage.theme === "dark";
  });
  const [performance, setPerformance] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.performance === "true";
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
  }, [isDark, performance]);

  const updateTheme = (dark: boolean, performanceMode: boolean): void => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    localStorage.setItem("performance", performanceMode.toString());
  };

  const toggleDarkMode = (): void => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    updateTheme(newDarkMode, performance);
  };

  const togglePerformance = (): void => {
    const newPerformance = !performance;
    setPerformance(newPerformance);
    updateTheme(isDark, newPerformance);
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={togglePerformance}
        className="p-2 rounded-full bg-slate-800/10 hover:bg-slate-800/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-sm transition-colors"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        aria-label="Toggle performance mode"
      >
        <motion.div
          animate={{ rotate: performance ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles
            className={`w-4 h-4 ${
              performance
                ? "text-yellow-400"
                : "text-slate-900/80 dark:text-white/70"
            }`}
          />
        </motion.div>
      </motion.button>

      <motion.button
        onClick={toggleDarkMode}
        className="p-2 rounded-full bg-slate-800/10 hover:bg-slate-800/20 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-sm transition-colors"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        aria-label="Toggle dark mode"
      >
        <motion.div
          animate={{ rotate: isDark ? 0 : 180 }}
          transition={{ duration: 0.5 }}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-400" />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}

// Navigation Links
const navLinks: NavLink[] = [
  { href: "/rooms", label: "Rooms", icon: Users },
  // { href: "/ranks", label: "Ranks", icon: Trophy },
];

// Main Navbar Component
export function Navbar() {
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState<string>(pathname);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notAllowed = ["/game"];

  // Check if current page should hide the navbar
  const shouldHideNavbar = notAllowed.includes(currentPage);

  useEffect(() => {
    setCurrentPage(pathname);
    setIsOpen(false);
    // Close profile dropdown when navigating to a restricted page
    if (notAllowed.includes(pathname)) {
      setShowProfile(false);
    }
  }, [notAllowed, pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = (): void => {
    logout();
    setShowProfile(false);
  };

  const handleShowProfile = (username: string): void => {
    router.push(`/profile/${username}`)
    setShowProfile(false);
  };

  const handleNavigation = (href: string): void => {
    setCurrentPage(href);
    setIsOpen(false);
    // Add your navigation logic here
    router.push(href);
    console.log(`Navigate to ${href}`);
  };

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  const displayName = user.display_name || user.username;
  const userLevel = Math.floor(user.total_score / 10);

  return (
    <AnimatePresence>
      {!shouldHideNavbar && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ 
            duration: 0.6, 
            ease: "easeInOut",
            type: "spring",
            stiffness: 100,
            damping: 20
          }}
          className="sticky top-0 z-40 w-full"
        >
          {/* Glassy Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/10 to-pink-500/5 dark:from-black/10 dark:via-black/20 dark:to-black/10 backdrop-blur-xl border-b border-white/10 dark:border-white/5" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/">
              <motion.div whileHover={{ scale: 1.02 }} className="flex-shrink-0">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Khawawish
                </h1>
                <p className="text-xs text-black/70  dark:text-white/60 hidden sm:block">
                  The Guessing Game
                </p>
              </motion.div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-6">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = currentPage === link.href;

                  return (
                    <motion.button
                      key={link.href}
                      onClick={() => handleNavigation(link.href)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-black/20 text-slate-800 dark:bg-white/20 dark:text-white shadow-lg"
                          : "text-slate-800/70 hover:text-slate-800 hover:bg-slate-800/10 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-4">
                {/* Dark Mode Toggle */}
                <DarkModeToggle />

                {/* Profile Section */}
                <div className="relative" ref={profileRef}>
                  <motion.button
                    onClick={() => setShowProfile(!showProfile)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-full h-full rounded-full border border-surfacel-500 dark:border-surfaced-500 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                          {user.avatar_url ? (
                            <NextImage
                              src={user.avatar_url}
                              alt={displayName}
                              className="w-8 h-8"
                              unoptimized
                              width={150}
                              height={150}
                            />
                          ) : (
                            <UserIcon size={26} className="text-gray-400" />
                          )}
                        </div>

                        {user.in_game && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                        )}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-white truncate max-w-24">
                          {displayName}
                        </div>
                        <div className="text-xs text-white/60">
                          Level {userLevel}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                        showProfile ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {showProfile && (
                      <ProfileCard
                        user={user}
                        onShow={handleShowProfile}
                        onLogout={handleLogout}
                        onClose={() => setShowProfile(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Menu Button */}
                <motion.button
                  onClick={() => setIsOpen(!isOpen)}
                  whileTap={{ scale: 0.95 }}
                  className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                >
                  {isOpen ? (
                    <X className="w-5 h-5 text-white" />
                  ) : (
                    <Menu className="w-5 h-5 text-white" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="md:hidden overflow-hidden"
                >
                  <div className="px-2 pt-2 pb-3 space-y-1 bg-black/20 rounded-b-2xl backdrop-blur-xl mt-1">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = currentPage === link.href;

                      return (
                        <motion.button
                          key={link.href}
                          onClick={() => handleNavigation(link.href)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "text-white/70 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {link.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {children}
    </div>
  );
}