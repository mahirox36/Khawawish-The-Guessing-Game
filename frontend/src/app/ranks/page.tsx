"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Crown,
  Flame,
  Star,
  ArrowUp,
  ArrowDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Activity,
  BarChart3,
  X,
  Award,
} from "lucide-react";
import { api } from "@/api";
import Spinner from "@/components/Spinner";
import NextImage from "next/image";
import { useRouter } from "next/navigation";

interface RankEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  games_won: number;
  total_score: number;
  best_streak: number;
  games_played: number;
  win_rate: number;
  average_score: number;
}

interface RankResponse {
  entries: RankEntry[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

type SortOption =
  | "games_won"
  | "total_score"
  | "best_streak"
  | "average_score"
  | "games_played";

const SORT_OPTIONS: {
  value: SortOption;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color: string;
}[] = [
  {
    value: "games_won",
    label: "Most Wins",
    icon: Trophy,
    color: "from-yellow-500 to-amber-500",
  },
  {
    value: "total_score",
    label: "Total Score",
    icon: Star,
    color: "from-purple-500 to-pink-500",
  },
  {
    value: "best_streak",
    label: "Best Streak",
    icon: Flame,
    color: "from-orange-500 to-red-500",
  },
  {
    value: "average_score",
    label: "Avg Score",
    icon: BarChart3,
    color: "from-blue-500 to-cyan-500",
  },
  {
    value: "games_played",
    label: "Most Active",
    icon: Activity,
    color: "from-indigo-500 to-purple-500",
  },
];

export default function RankPage() {
  const [rank, setRank] = useState<RankResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("games_won");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [minGames, setMinGames] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadRank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, order, page, pageSize, minGames]);

  const loadRank = async () => {
    setLoading(true);
    try {
      const response = await api.get<RankResponse>("/leaderboard", {
        params: {
          sort_by: sortBy,
          order,
          page,
          page_size: pageSize,
          min_games: minGames,
        },
      });
      setRank(response.data);
    } catch (error) {
      console.error("Failed to load Rank:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <Crown
            size={26}
            className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]"
          />
        );
      case 2:
        return <Trophy size={24} className="text-slate-300 drop-shadow-sm" />;
      case 3:
        return <Award size={24} className="text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden pt-8 pb-12 px-4"
      >
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-primary-500 to-secondary-500">
                Ranks
              </h1>
            </div>
          </motion.div>

          {/* Sort and Filter Controls */}
          <div className="flex flex-col gap-4 items-center justify-between">
            {/* Sort Options */}
            <div className="w-full flex flex-wrap gap-2 justify-center">
              {SORT_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSortBy(option.value)}
                  className={`px-4 py-2 rounded-full font-semibold hover:cursor-pointer transition-colors text-sm ${
                    sortBy === option.value
                      ? `bg-gradient-to-r ${option.color} text-white shadow-xl`
                      : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:shadow-lg border border-white/40 dark:border-gray-700/40"
                  }`}
                >
                  <option.icon className="inline mr-2" size={16} />
                  {option.label}
                </motion.button>
              ))}
            </div>

            {/* Secondary Controls */}
            <div className="flex gap-3 items-center flex-wrap justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
                className="px-4 py-2 rounded-full font-semibold bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:shadow-lg transition-colors hover:cursor-pointer border border-white/40 dark:border-gray-700/40"
              >
                {order === "desc" ? (
                  <ArrowDown className="inline mr-2" size={16} />
                ) : (
                  <ArrowUp className="inline mr-2" size={16} />
                )}
                {order === "desc" ? "Highest" : "Lowest"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-full font-semibold bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:shadow-lg hover:cursor-pointer transition-colors border border-white/40 dark:border-gray-700/40"
              >
                <Filter className="inline mr-2" size={16} />
                Filters
              </motion.button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                  />

                  {/* Modal */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowFilters(false)}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                          Filter Results
                        </h3>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hover:cursor-pointer"
                        >
                          <X
                            size={20}
                            className="text-gray-500 dark:text-gray-400"
                          />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Minimum Games Played
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1000"
                            value={minGames}
                            onChange={(e) => {
                              setMinGames(parseInt(e.target.value) || 0);
                              setPage(1);
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            placeholder="Enter minimum games"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Results Per Page
                          </label>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(parseInt(e.target.value));
                              setPage(1);
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                          >
                            <option value="10">10 per page</option>
                            <option value="20">20 per page</option>
                            <option value="50">50 per page</option>
                            <option value="100">100 per page</option>
                          </select>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setMinGames(0);
                            setPage(1);
                          }}
                          className="flex-1 px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hover:cursor-pointer"
                        >
                          Reset Filters
                        </button>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="flex-1 px-4 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors hover:cursor-pointer"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : rank && rank.entries.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {/* Desktop Table */}
              <div className="hidden md:block bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-2xl overflow-hidden border border-white/40 dark:border-gray-700/40 backdrop-blur">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-accent-500/20 border-b border-gray-200/50 dark:border-gray-700/50">
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                          Rank
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">
                          Player
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                          Wins
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                          Score
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                          Streak
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                          Win Rate
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                          Avg Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rank.entries.map((entry, idx) => (
                        <motion.tr
                          key={entry.user_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{
                            backgroundColor: "rgba(99, 102, 241, 0.05)",
                          }}
                          className="border-b border-gray-100/50 dark:border-gray-700/30 hover:bg-primary-500/5 transition-all duration-200 cursor-pointer"
                          onClick={() =>
                            router.push(`/profile/${entry.username}`)
                          }
                        >
                          <td className="px-6 py-4 font-bold">
                            <div className="flex items-center space-x-3">
                              {getMedalIcon(entry.rank) ? (
                                getMedalIcon(entry.rank)
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {entry.rank}
                                  </span>
                                </div>
                              )}
                              <span className="text-gray-900 dark:text-white">
                                #{entry.rank}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-secondary-400 flex-shrink-0">
                                {entry.avatar_url ? (
                                  <NextImage
                                    src={entry.avatar_url}
                                    alt={entry.display_name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <UserIcon className="w-full h-full p-2 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">
                                  {entry.display_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  @{entry.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Trophy size={16} className="text-yellow-500" />
                              <span className="font-bold text-gray-900 dark:text-white">
                                {entry.games_won}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Star size={16} className="text-purple-500" />
                              <span className="font-bold text-gray-900 dark:text-white">
                                {entry.total_score}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {entry.best_streak > 5 && (
                                <Flame
                                  size={16}
                                  className="text-orange-500 animate-pulse"
                                />
                              )}
                              <span className="font-bold text-gray-900 dark:text-white">
                                {entry.best_streak}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                              <span className="font-bold text-green-800 dark:text-green-200">
                                {entry.win_rate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {entry.average_score.toFixed(1)}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rank.entries.map((entry, idx) => (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push(`/profile/${entry.username}`)}
                    className="bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-lg border border-white/40 dark:border-gray-700/40 p-4 cursor-pointer hover:shadow-xl transition-colors"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      {getMedalIcon(entry.rank) ? (
                        <div className="flex-shrink-0">
                          {getMedalIcon(entry.rank)}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {entry.rank}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-white truncate">
                          {entry.display_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{entry.username}
                        </div>
                      </div>
                    </div>

                    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-primary-400 to-secondary-400">
                      {entry.avatar_url ? (
                        <NextImage
                          src={entry.avatar_url}
                          alt={entry.display_name}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <UserIcon className="w-full h-full p-6 text-white" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2">
                        <div className="text-gray-600 dark:text-gray-400 font-medium">
                          Wins
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white text-lg">
                          {entry.games_won}
                        </div>
                      </div>
                      <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2">
                        <div className="text-gray-600 dark:text-gray-400 font-medium">
                          Score
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white text-lg">
                          {entry.total_score}
                        </div>
                      </div>
                      <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2">
                        <div className="text-gray-600 dark:text-gray-400 font-medium">
                          Streak
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white text-lg">
                          {entry.best_streak}
                        </div>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                        <div className="text-gray-600 dark:text-gray-400 font-medium">
                          Win Rate
                        </div>
                        <div className="font-bold text-gray-900 dark:text-white text-lg">
                          {entry.win_rate.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-4 mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:cursor-pointer bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:shadow-lg transition-color disabled:opacity-50 disabled:cursor-not-allowed border border-white/40 dark:border-gray-700/40"
                >
                  <ChevronLeft size={20} />
                </motion.button>

                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                    Page {page} of {rank.total_pages}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setPage(Math.min(rank.total_pages, page + 1))
                  }
                  disabled={page === rank.total_pages}
                  className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:shadow-lg transition-colors disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed border border-white/40 dark:border-gray-700/40"
                >
                  <ChevronRight size={20} />
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white/95 dark:bg-gray-800/95 rounded-2xl shadow-lg border border-white/40 dark:border-gray-700/40"
            >
              <Trophy className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters or sorting options
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
