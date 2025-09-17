import { Lobby } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, Image } from 'lucide-react';

interface LobbyListProps {
  in_game?: boolean;
  lobbies: Lobby[];
  onJoinLobby: (lobbyId: string, hasPassword: boolean) => void;
}

export function LobbyList({ in_game, lobbies, onJoinLobby }: LobbyListProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Lobbies</h2>
      <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {lobbies.length > 0 ? (
            lobbies.map((lobby) => (
              <motion.div
                key={lobby.lobby_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden
                         border border-gray-200 dark:border-gray-700 hover:shadow-lg
                         transition-all duration-200"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {lobby.lobby_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Users size={16} />
                          <span>{lobby.player_count}/2 Players</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Image size={16} />
                          <span>{lobby.max_images} Characters</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {lobby.has_password && (
                        <Lock className="text-game-accent" size={20} />
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onJoinLobby(lobby.lobby_id, lobby.has_password)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white
                                 bg-gradient-to-r from-game-primary to-game-secondary
                                 hover:opacity-90 transition-all duration-200 hover:cursor-pointer
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-game-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={in_game || lobby.player_count >= 2}

                      >
                        Join Lobby
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No lobbies available yet. Create one to start playing!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}