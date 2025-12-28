"use client";

import { useState } from "react";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";

export default function App() {
  const {
    images,
    handleCharacterDiscard,
    handleOwnCharacterSelect,
    handleGuessCharacter,
    handleEndTurn,
    handleRematch,
    phase,
    status,
    handleLeaveGame,
    currentLobby,
    ownImage,
    setOwnImage,
    setSelectedIndexes,
    selectedIndexes,
    isShiftHeld,
    isAltHeld,
    opponentImage,
  } = useGame();
  const { user } = useAuth();

  const [action, setAction] = useState<"Guess" | "Discard">("Discard");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageZoomLevel, setImageZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleClick = (index: number, image: string) => {
    if (phase === "results") return;
    if (phase === "selection") {
      setOwnImage(image);
      handleOwnCharacterSelect(image);
      return;
    }

    if (isAltHeld) {
      setImageZoomLevel(1);
      setZoomedImage(image);
      return;
    }

    if (action === "Discard") {
      setSelectedIndexes((prev) =>
        prev.includes(index.toString())
          ? prev.filter((i) => i !== index.toString())
          : [...prev, index.toString()]
      );
      handleCharacterDiscard(image);
    } else {
      handleGuessCharacter(image);
      setAction("Discard");
    }
  };

  return (
    <div className="min-h-screen bg-[game-bg-light] dark:bg-darkb-500">
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center"
            onClick={() => {
              setZoomedImage(null);
              setImageZoomLevel(1);
              setPanPosition({ x: 0, y: 0 });
            }}
          >
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-gray-900/90 rounded-full px-6 py-3 border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() =>
                  setImageZoomLevel((prev) => Math.max(0.5, prev - 0.25))
                }
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="Zoom Out"
              >
                −
              </button>

              <span className="text-white text-sm font-semibold min-w-[60px] text-center">
                {Math.round(imageZoomLevel * 100)}%
              </span>

              <button
                onClick={() =>
                  setImageZoomLevel((prev) => Math.min(4, prev + 0.25))
                }
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="Zoom In"
              >
                +
              </button>

              <div className="w-px h-6 bg-white/20 mx-1" />

              <button
                onClick={() => {
                  setImageZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
              >
                Reset
              </button>
            </motion.div>

            {/* Close */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImage(null);
                setImageZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
              }}
              className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-gray-900/90 hover:bg-red-600 text-white transition border border-white/10 shadow-2xl"
            >
              <X size={20} />
            </button>

            {/* Image */}
            <div
              className="relative"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.15 : 0.15;
                setImageZoomLevel((prev) =>
                  Math.max(0.5, Math.min(4, prev + delta))
                );
              }}
              onMouseDown={(e) => {
                if (imageZoomLevel > 1) {
                  e.preventDefault();
                  setIsDragging(true);
                  setDragStart({
                    x: e.clientX - panPosition.x,
                    y: e.clientY - panPosition.y,
                  });
                }
              }}
              onMouseMove={(e) => {
                if (isDragging && imageZoomLevel > 1) {
                  setPanPosition({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y,
                  });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              style={{
                cursor:
                  imageZoomLevel > 1
                    ? isDragging
                      ? "grabbing"
                      : "grab"
                    : "default",
              }}
            >
              <motion.img
                src={zoomedImage}
                alt="Zoomed"
                className="select-none max-w-[85vw] max-h-[85vh] object-contain pointer-events-none"
                style={{
                  transform: `scale(${imageZoomLevel}) translate(${
                    panPosition.x / imageZoomLevel
                  }px, ${panPosition.y / imageZoomLevel}px)`,
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                  willChange: "transform",
                }}
                draggable={false}
              />
            </div>

            {/* Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium bg-gray-900/50 px-4 py-2 rounded-full"
            >
              Scroll to zoom • Drag to pan • Click outside to close
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen text-gray-900 dark:text-white"
      >
        {/* Main Game Layout */}
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Panel - Title and Status */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:w-64 p-3 lg:p-4 bg-surfacel-500 dark:bg-surfaced-500 lg:min-h-screen justify-between flex flex-col items-center"
          >
            <div className="w-full">
              <motion.h1
                className="text-xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500 flex-shrink-0 text-center lg:text-left"
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
                  className={`mt-2 lg:mt-4 text-base lg:text-lg font-semibold text-center lg:text-left ${
                    user?.user_id === currentLobby?.user_turn
                      ? "text-secondary-500"
                      : "text-accent-500"
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

              {status && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-2 lg:mt-4 text-lg lg:text-xl font-bold text-center lg:text-left
                ${status === "Win" ? "text-secondary-500" : "text-red-500"}`}
                >
                  {status === "Win" ? "You Won! 🎉" : "Game Over 😔"}
                </motion.div>
              )}

              {status && (
                <motion.div
                  className="flex flex-col gap-2 lg:gap-3 mt-2 lg:mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {currentLobby?.owner?.user_id === user?.user_id && (
                    <button
                      onClick={handleRematch}
                      className="px-3 lg:px-4 py-2 rounded-lg font-semibold bg-secondary-500 text-white hover:shadow-lg transition-all text-sm lg:text-base"
                    >
                      Rematch
                    </button>
                  )}
                  <button
                    onClick={handleLeaveGame}
                    className="px-3 lg:px-4 py-2 rounded-lg font-semibold bg-accent-500 text-white hover:shadow-lg transition-all text-sm lg:text-base"
                  >
                    Leave Game
                  </button>
                </motion.div>
              )}
            </div>

            {/* Character Images Section */}
            <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 w-full justify-center lg:justify-start mt-4 lg:mt-0">
              {/* Your Character */}
              {ownImage && (
                <motion.div
                  className="p-2 lg:p-3 rounded-lg bg-surfacel-500 dark:bg-surfaced-500 shadow-md group flex-1 lg:flex-none max-w-[120px] lg:max-w-none"
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 lg:mb-2 text-center lg:text-left">
                    Your Character
                  </h3>
                  <div className="relative aspect-square rounded-md overflow-hidden">
                    <NextImage
                      src={ownImage}
                      alt="Your character"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      fill
                    />
                  </div>
                </motion.div>
              )}

              {/* Opponent's Character (shown only in results phase) */}
              {phase === "results" && opponentImage && (
                <motion.div
                  className="p-2 lg:p-3 rounded-lg bg-surfacel-500 dark:bg-surfaced-500 shadow-md group flex-1 lg:flex-none max-w-[120px] lg:max-w-none"
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 lg:mb-2 text-center lg:text-left">
                    Opponents Character
                  </h3>
                  <div className="relative aspect-square rounded-md overflow-hidden">
                    <NextImage
                      src={opponentImage}
                      alt="Opponent's character"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                      fill
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Main Grid Area */}
          <motion.div
            className="flex-grow p-2 lg:p-4 overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mx-auto max-w-5xl grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 lg:gap-3 auto-rows-fr">
              {images.map((img, index) => (
                <motion.div
                  key={index}
                  whileHover={
                    zoomedImage
                      ? {}
                      : {
                          scale: isAltHeld ? 1.05 : 1.02,
                          rotate:
                            action === "Guess" && !isAltHeld
                              ? [0, -5, 5, -5, 0]
                              : 0,
                        }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    rotate: {
                      duration: 0.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                    },
                  }}
                  whileTap={zoomedImage ? {} : { scale: 0.98 }}
                  className={`group relative overflow-hidden rounded-lg shadow-lg 
          ${
            selectedIndexes.includes(index.toString()) && !isShiftHeld
              ? "ring-2 lg:ring-4 ring-red-500/50"
              : ""
          } ${ownImage === img ? "ring-2 lg:ring-4 ring-secondary-500/50" : ""} 
          bg-surfacel-500 dark:bg-surfaced-500
          transform cursor-pointer aspect-square
          ${
            isAltHeld && !zoomedImage
              ? "hover:ring-2 lg:hover:ring-4 hover:ring-blue-500/70 hover:z-10"
              : action === "Guess" && !zoomedImage
              ? "hover:ring-2 lg:hover:ring-4 hover:ring-primary-500/70"
              : !zoomedImage
              ? "hover:ring-2 lg:hover:ring-4 hover:ring-red-500/50"
              : ""
          }
          ${zoomedImage === img ? "opacity-50" : ""}`} // Dim the original when zoomed
                  onClick={() => handleClick(index, img)}
                >
                  <NextImage
                    src={img}
                    alt={`Character ${index + 1}`}
                    className="w-full h-full object-contain"
                    fill
                  />
                  {selectedIndexes.includes(index.toString()) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={
                        !isShiftHeld
                          ? `absolute inset-0 bg-red-500/20 ${
                              localStorage.performance === "true"
                                ? ""
                                : "backdrop-blur-sm"
                            }`
                          : ""
                      }
                    >
                      {!isShiftHeld && (
                        <X
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white"
                          size={20}
                        />
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Panel - Actions (Mobile: Bottom, Desktop: Right) */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:w-48 p-3 lg:p-4 bg-surfacel-500 dark:bg-surfaced-500 lg:min-h-screen flex-shrink-0
                    flex flex-row lg:flex-col items-center lg:items-stretch justify-center gap-2 lg:gap-4"
          >
            <button
              onClick={() => {
                if (action === "Discard") {
                  setAction("Guess");
                } else {
                  setAction("Discard");
                }
              }}
              className={`px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold transition-all text-xs lg:text-base disabled:opacity-50 disabled:cursor-not-allowed 
              ${
                action === "Guess"
                  ? "bg-secondary-500 text-white"
                  : "bg-primary-500 text-white hover:shadow-lg"
              } hover:shadow-lg flex-1 lg:flex-none`}
              disabled={
                phase !== "guessing" ||
                user?.user_id !== currentLobby?.user_turn
              }
            >
              {action === "Guess" ? "Switch to Discard" : "Guess Character"}
            </button>
            <button
              onClick={handleEndTurn}
              className="px-3 lg:px-4 py-2 lg:py-3 rounded-lg font-semibold bg-accent-500 text-white hover:shadow-lg transition-all text-xs lg:text-base flex-1 lg:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                phase !== "guessing" ||
                user?.user_id !== currentLobby?.user_turn
              }
            >
              End Turn
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
