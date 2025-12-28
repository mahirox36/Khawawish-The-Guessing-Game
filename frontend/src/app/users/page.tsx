"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Trophy,
  Star,
  User as UserIcon,
  X,
  Gamepad2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { api } from "@/api";
import Spinner from "@/components/Spinner";
import NextImage from "next/image";
import { useRouter } from "next/navigation";

interface UserSearchResult {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  banner_url?: string;
  games_won: number;
  total_score: number;
  in_game: boolean;
  is_verified: boolean;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!searchQuery.trim()) {
      setResults([]);
      setError("");
      return;
    }

    if (searchQuery.length < 2) {
      setError("Search query must be at least 2 characters");
      setResults([]);
      return;
    }

    setLoading(true);
    setError("");

    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await api.get<UserSearchResult[]>("/search/users", {
          params: {
            q: searchQuery,
            limit: 30,
          },
        });
        setResults(response.data);
        if (response.data.length === 0) {
          setError("No users found. Try a different search.");
        }
      } catch (err) {
        console.error("Search failed:", err);
        setError("Failed to search users. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [searchQuery]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden pt-8 pb-12 px-4"
      >

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur-xl opacity-20 animate-pulse" />
              <div className="relative bg-white/95 dark:bg-gray-800/95 rounded-2xl p-2 shadow-2xl border border-white/40 dark:border-gray-700/40 backdrop-blur">
                <div className="flex items-center space-x-4 px-6 py-4">
                  <motion.div
                    transition={{
                      duration: searchQuery ? 0 : 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Search className="text-primary-500" size={24} />
                  </motion.div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or display name..."
                    className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSearchQuery("")}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Results Section */}
      <div className="px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-16"
            >
              <Spinner />
            </motion.div>
          ) : error && !searchQuery.trim() ? null : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-lg border border-white/40 dark:border-gray-700/40 p-8 text-center"
            >
              <Search className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {error}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try searching with a different name or term
              </p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              variants={container}
              animate="show"
              className="space-y-3"
            >
              {results.map((user) => (
                <motion.div
                  key={user.user_id}
                  variants={item}
                  whileHover={{ x: 4 }}
                  onClick={() => router.push(`/profile/${user.username}`)}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-lg transition-colors duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Banner image */}
                  {user.banner_url && (
                    <>
                      <div className="absolute inset-0">
                        <NextImage
                          src={user.banner_url}
                          alt={user.display_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      {/* Dark overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70 backdrop-blur-[2px]" />
                    </>
                  )}

                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-secondary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  <div className="relative flex items-center gap-4 p-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-secondary-400 ring-2 ring-white dark:ring-gray-800 group-hover:ring-primary-400 dark:group-hover:ring-primary-600 transition-all">
                        {user.avatar_url ? (
                          <NextImage
                            src={user.avatar_url}
                            alt={user.display_name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <UserIcon className="w-full h-full p-3 text-white" />
                        )}
                      </div>

                      {/* Status indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center bg-white dark:bg-gray-800">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            user.in_game
                              ? "bg-red-500 animate-pulse"
                              : "bg-green-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-lg font-semibold truncate group-hover:text-primary-400 transition-colors ${
                            user.banner_url
                              ? "text-white"
                              : "text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400"
                          }`}
                        >
                          {user.display_name}
                        </h3>
                        {user.is_verified && (
                          <CheckCircle
                            size={16}
                            className={
                              user.banner_url
                                ? "text-blue-400"
                                : "text-blue-500"
                            }
                          />
                        )}
                        {user.in_game && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-xs font-medium backdrop-blur-sm">
                            <Gamepad2 size={12} />
                            Playing
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm ${
                          user.banner_url
                            ? "text-gray-200"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        @{user.username}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 mr-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                          <Trophy size={16} />
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            user.banner_url
                              ? "text-white"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {user.games_won}
                        </div>
                        <div
                          className={`text-xs ${
                            user.banner_url
                              ? "text-gray-200"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          Wins
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                          <Star size={16} />
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            user.banner_url
                              ? "text-white"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {user.total_score.toLocaleString()}
                        </div>
                        <div
                          className={`text-xs ${
                            user.banner_url
                              ? "text-gray-200"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          Score
                        </div>
                      </div>
                    </div>

                    {/* Mobile stats */}
                    <div className="flex sm:hidden items-center gap-3 text-sm">
                      <div
                        className={`flex items-center gap-1 ${
                          user.banner_url
                            ? "text-yellow-400"
                            : "text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        <Trophy size={14} />
                        <span className="font-semibold">{user.games_won}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          user.banner_url
                            ? "text-purple-400"
                            : "text-purple-600 dark:text-purple-400"
                        }`}
                      >
                        <Star size={14} />
                        <span className="font-semibold">
                          {user.total_score.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <ArrowRight
                      size={20}
                      className={`group-hover:translate-x-1 transition-all flex-shrink-0 ${
                        user.banner_url
                          ? "text-gray-300 group-hover:text-primary-300"
                          : "text-gray-400 group-hover:text-primary-500"
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : searchQuery.trim() ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-lg border border-white/40 dark:border-gray-700/40 p-12 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-6"
              >
                <Search className="mx-auto text-gray-400" size={48} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Ready to search?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Start typing a username or display name to find players
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-lg border border-white/40 dark:border-gray-700/40 p-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-6"
              >
                <UserIcon className="mx-auto text-primary-500" size={48} />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Ready to discover?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Search for players by their username or display name to see
                their profiles
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
