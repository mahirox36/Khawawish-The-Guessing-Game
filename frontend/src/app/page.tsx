"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";


export default function HomePage() {
  const router = useRouter();
  const {token} = useAuth()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4"
    >
      
      <div className="text-center max-w-4xl mx-auto">
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-6xl font-bold text-gradient mb-6 dark:text-white"
        >
          Khawawish
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-600 dark:text-gray-400 mb-8"
        >
          Guess Who, but with bizarre characters—mostly anime!
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-500 dark:text-gray-500 mb-12"
        >
          Challenge your friends in this guessing game where you will encounter
          the most unexpected characters from anime, games, and internet culture.
        </motion.p>

        <motion.button
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (token) router.push("/rooms")
            else router.push("/login")
          }}
          className="bg-primary-500 hover:bg-primary-600 text-white text-xl px-8 py-4 rounded-xl font-semibold shadow-lg transition-colors hover:cursor-pointer"
        >
          Start Playing
        </motion.button>
      </div>
    </motion.div>
  );
}