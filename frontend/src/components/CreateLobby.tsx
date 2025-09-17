import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Users, Image } from 'lucide-react';

interface CreateLobbyProps {
  in_game?: boolean;
  onCreateLobby: (data: {
    maxImages: number;
    lobbyName: string;
    password: string | null;
    isPrivate: boolean;
  }) => void;
}

export function CreateLobby({ in_game, onCreateLobby }: CreateLobbyProps) {
  const [maxImages, setMaxImages] = useState(25);
  const [lobbyName, setLobbyName] = useState('');
  const [password, setPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateLobby({
      maxImages,
      lobbyName,
      password: password.trim() || null,
      isPrivate
    });
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Lobby</h2>
      
      <div className="space-y-2">
        <label htmlFor="lobbyName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Lobby Name
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            id="lobbyName"
            value={lobbyName}
            onChange={(e) => setLobbyName(e.target.value)}
            className="pl-10 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-game-primary dark:focus:ring-game-secondary focus:border-transparent
                     transition-colors duration-200"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="maxImages" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Number of Characters
        </label>
        <div className="relative">
          <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="number"
            id="maxImages"
            value={maxImages}
            onChange={(e) => setMaxImages(Number(e.target.value))}
            className="pl-10 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-game-primary dark:focus:ring-game-secondary focus:border-transparent
                     transition-colors duration-200"
            min={5}
            max={100}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Password (optional)
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            id="lobby_password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-game-primary dark:focus:ring-game-secondary focus:border-transparent
                     transition-colors duration-200"
          />
        </div>
      </div>

      <motion.div 
        className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
        whileHover={{ scale: 1.02 }}
      >
        <motion.input
          whileTap={{ scale: 0.9 }}
          type="checkbox"
          id="isPrivate"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-5 w-5 text-game-primary focus:ring-game-primary rounded
                   border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        />
        <label htmlFor="isPrivate" className="text-sm text-gray-700 dark:text-gray-200">
          Make this lobby private
        </label>
      </motion.div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white
                 bg-gradient-to-r from-game-primary to-game-secondary hover:opacity-90
                 transform transition-all duration-200 hover:cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-game-primary disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={in_game}
      >
        Create Lobby
      </motion.button>
    </motion.form>
  );
}