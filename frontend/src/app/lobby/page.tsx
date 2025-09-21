"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useGame } from "@/contexts/GameContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/api";
import { User } from "@/types";

export default function App() {
  const { user } = useAuth();
  const [secondUser, setSecondUser] = useState<User | null>();
  const [ownerUser, setOwnerUser] = useState<User | null>();
  const {
    ws,
    currentLobby,
    handleReadyClick,
    handleStartGame,
    handleLeaveGame,
  } = useGame();

  useEffect(() => {
    (async () => {
      if (currentLobby && currentLobby.second_player) {
        setSecondUser(
          (await api.get(`/user/${currentLobby.second_player.username}`)).data
        );
      } else {
        setSecondUser(null);
      }
      if (currentLobby && currentLobby.owner) {
        setOwnerUser(
          (await api.get(`/user/${currentLobby.owner.username}`)).data
        );
      } else {
        setOwnerUser(null);
      }
    })();
  }, [currentLobby]);

  const router = useRouter();
  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/rooms");
    router.prefetch("/game");

    if (!currentLobby) {
      router.push("/rooms");
    }
  }, [router, currentLobby]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen  text-gray-900 dark:text-white p-8 pr-16"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-surfacel-500 dark:bg-surfaced-500 p-8 rounded-xl shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-6">Waiting Room</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">Lobby: {currentLobby?.lobby_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Players: {currentLobby?.player_count}/2
              </p>
            </div>

            {/* Players List */}
            <div className="mt-4 space-y-2">
              <h3 className="text-xl font-semibold">Players</h3>
              <div className="space-x-2 flex">
                {currentLobby?.owner && (
                  <div className="flex-initial w-lg h-32 flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  style={{
                      backgroundImage: ownerUser?.banner_url
                        ? `linear-gradient(135deg, rgba(52, 211, 153, 0.3), rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3)), url(${ownerUser.banner_url})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "overlay",
                    }}>
                    <div className="flex items-center gap-2">
                      <Crown className="text-yellow-500" />
                      <span>{currentLobby?.owner.display_name}</span>
                      {currentLobby?.owner.is_ready && (
                        <span className="text-green-500 text-sm">(Ready)</span>
                      )}
                    </div>
                  </div>
                )}
                {currentLobby?.second_player && (
                  <div
                    className="flex-initial w-lg h-32 flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    style={{
                      backgroundImage: secondUser?.banner_url
                        ? `linear-gradient(135deg, rgba(52, 211, 153, 0.3), rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3)), url(${secondUser.banner_url})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundBlendMode: "overlay",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{currentLobby?.second_player.display_name}</span>
                      {currentLobby?.second_player.is_ready && (
                        <span className="text-green-500 text-sm">(Ready)</span>
                      )}
                    </div>
                    {user?.user_id === currentLobby?.owner?.user_id && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          ws?.send(
                            JSON.stringify({
                              type: "kick_player",
                              user_id: currentLobby?.second_player?.user_id,
                            })
                          )
                        }
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      >
                        Kick
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReadyClick}
                  className="px-6 py-3 rounded-lg bg-secondary-500 text-white hover:bg-opacity-90 transition-colors"
                >
                  Ready
                </motion.button>
                {user?.user_id === currentLobby?.owner?.user_id && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartGame}
                    className="px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-opacity-90 transition-colors"
                  >
                    Start Game
                  </motion.button>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLeaveGame}
                className="px-6 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Leave Lobby
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
