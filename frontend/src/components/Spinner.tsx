import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Seeded random function for consistent positions
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

interface SpinnerProp {
  className?: string;
  small?: boolean;
}

export default function Spinner({ className, small = false }: SpinnerProp) {
  const [isClient, setIsClient] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 800 });

  useEffect(() => {
    setIsClient(true);
    // Set window dimensions on client side
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`${!small && "min-h-screen"} flex items-center justify-center relative overflow-hidden ${className}`}
    >
      {/* Animated background particles - only render on client */}
      {isClient && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-500/20 rounded-full"
              initial={{
                x: seededRandom(i * 123) * windowSize.width,
                y: seededRandom(i * 456) * windowSize.height,
                scale: 0,
              }}
              animate={{
                y: [null, -100, windowSize.height + 100],
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Main loading container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Outer glow ring */}
        <motion.div
          className="absolute w-32 h-32 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(80, 64, 247, 0.1) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Multiple rotating rings */}
        <div className="relative w-20 h-20">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#5040f7",
              borderRightColor: "#5040f7",
              filter: "drop-shadow(0 0 10px #5040f7)",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Middle ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-transparent"
            style={{
              borderLeftColor: "#7c3aed",
              borderBottomColor: "#7c3aed",
              filter: "drop-shadow(0 0 8px #7c3aed)",
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Inner ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "#06b6d4",
              borderRightColor: "#06b6d4",
              filter: "drop-shadow(0 0 6px #06b6d4)",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Center pulsing dot */}
          <motion.div
            className="absolute inset-6 rounded-full bg-gradient-to-r from-primary-500 to-purple-500"
            style={{
              filter: "drop-shadow(0 0 15px #5040f7)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Floating orbs around the spinner */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-primary-400 to-cyan-400 rounded-full"
            style={{
              filter: "blur(0.5px) drop-shadow(0 0 4px currentColor)",
            }}
            animate={{
              x: [
                0,
                Math.cos((i * Math.PI * 2) / 6) * 60,
                Math.cos(((i + 3) * Math.PI * 2) / 6) * 60,
                0,
              ],
              y: [
                0,
                Math.sin((i * Math.PI * 2) / 6) * 60,
                Math.sin(((i + 3) * Math.PI * 2) / 6) * 60,
                0,
              ],
              scale: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}

        {!small && (
          <>
            {/* Loading text with typewriter effect */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.h3
                className="text-2xl font-bold bg-gradient-to-r from-primary-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                Khawawish
              </motion.h3>

              <motion.div className="mt-4 flex items-center justify-center space-x-1">
                <span className="text-gray-600 dark:text-gray-400">
                  Loading
                </span>
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="text-primary-500 text-xl"
                    animate={{
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    .
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
