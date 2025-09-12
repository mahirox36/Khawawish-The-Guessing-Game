import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { baseUrl } from "../api";
import { Lobby } from "../types";
import { useAuth } from "../contexts/AuthContext";

interface GameProps {
  images: string[];
  onDiscardCharacter: (character: string) => void;
  onOwnCharacterSelect: (character: string) => void;
  onGuessCharacter: (character: string) => void;
  onEndTurn: () => void;
  phase: "selection" | "guessing" | "results";
  gameStatus: "Win" | "Lose" | null;
  currentLobby: Lobby | null;
}

export function Game({
  images,
  onDiscardCharacter: onDiscardCharacter,
  onOwnCharacterSelect,
  onGuessCharacter,
  onEndTurn,
  phase,
  gameStatus,
  currentLobby,
}: GameProps) {
  const { user } = useAuth();
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([]);
  const [ownImage, setOwnImage] = useState<string>();
  const [action, setAction] = useState<"Guess" | "Discard">("Discard");

  const handleClick = (index: number, image: string) => {
    if (phase === "results") return;
    if (phase === "selection") {
      setOwnImage(image);
      onOwnCharacterSelect(image);
      return;
    }
    if (action === "Discard") {
      setSelectedIndexes((prev) =>
        prev.includes(index.toString())
          ? prev.filter((i) => i !== index.toString())
          : [...prev, index.toString()]
      );
      onDiscardCharacter(image);
    } else {
      onGuessCharacter(image);
      setAction("Discard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950 text-gray-900 dark:text-white"
    >
      {/* Main Game Layout */}
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left Panel - Title and Status */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="md:w-64 p-4 bg-game-surface-light dark:bg-game-surface-dark md:h-screen flex-shrink-0"
        >
          <motion.h1
            className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-game-primary to-game-secondary"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {phase === "selection"
              ? "Select your Character"
              : phase === "guessing"
              ? "Guess Their Character"
              : "Game Results"}
          </motion.h1>

          {phase === "guessing" && (
            <motion.div
              className={`mt-4 text-lg font-semibold ${
                user?.user_id === currentLobby?.user_turn
                  ? "text-game-secondary"
                  : "text-game-accent"
              }`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {user?.user_id === currentLobby?.user_turn
                ? "It's Your Turn!"
                : "Waiting for Opponent..."}
            </motion.div>
          )}

          {gameStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-4 text-xl font-bold
                ${gameStatus === "Win" ? "text-game-secondary" : "text-red-500"}`}
            >
              {gameStatus === "Win" ? "You Won! 🎉" : "Game Over 😔"}
            </motion.div>
          )}
        </motion.div>

        {/* Main Grid Area */}
        <motion.div
          className="flex-grow p-4 overflow-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 auto-rows-fr">
            {images.map((img, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative overflow-hidden rounded-lg shadow-lg 
                  ${
                    selectedIndexes.includes(index.toString())
                      ? "ring-4 ring-red-500/50"
                      : ""
                  } ${ownImage === img ? "ring-4 ring-game-secondary/50" : ""} 
                  bg-game-surface-light dark:bg-game-surface-dark
                  transform transition-all duration-200 ease-in-out
                  aspect-square`}
                onClick={() => handleClick(index, img)}
              >
                <img
                  src={`${baseUrl}/static/images/${img}`}
                  alt={`Character ${index + 1}`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {selectedIndexes.includes(index.toString()) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`absolute inset-0 bg-red-500/20 ${
                      localStorage.performance === "true" ? "" : "backdrop-blur-sm"
                    }`}
                  >
                    <X
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white"
                      size={30}
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Panel - Actions */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="md:w-48 p-4 bg-game-surface-light dark:bg-game-surface-dark md:h-screen flex-shrink-0
                    flex md:flex-col items-center md:items-stretch justify-center gap-4"
        >
          <button
            onClick={() => setAction("Guess")}
            className={`px-4 py-3 rounded-lg font-semibold transition-all text-sm md:text-base
              ${
                action === "Guess"
                  ? "bg-game-primary text-white"
                  : "bg-game-surface-light dark:bg-game-surface-dark text-game-primary"
              } hover:shadow-lg flex-1 md:flex-none`}
          >
            Guess Character
          </button>
          <button
            onClick={onEndTurn}
            className="px-4 py-3 rounded-lg font-semibold bg-game-accent text-white hover:shadow-lg transition-all text-sm md:text-base flex-1 md:flex-none"
          >
            End Turn
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
