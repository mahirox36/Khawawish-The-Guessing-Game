"use client";

import { LobbyList } from "@/components/LobbyList";
import { CreateLobby } from "@/components/CreateLobby";
import { motion } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function App() {
  const { connectedError, handleCreateLobby, lobbies, handleJoinLobby } =
    useGame();

  const router = useRouter();
  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/lobby");
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className=""
    >
      <div className="text-gray-900 dark:text-white p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surfacel-500 dark:bg-surfaced-500 p-8 rounded-xl shadow-xl"
          >
            <CreateLobby
              in_game={connectedError}
              onCreateLobby={handleCreateLobby}
            />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-surfacel-500 dark:bg-surfaced-500 p-8 rounded-xl shadow-xl"
          >
            <LobbyList
              in_game={connectedError}
              lobbies={lobbies}
              onJoinLobby={handleJoinLobby}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
