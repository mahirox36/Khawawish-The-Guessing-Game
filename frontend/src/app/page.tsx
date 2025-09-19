"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Login } from "@/components/Login";
import { Register } from "@/components/Register";
import { Game } from "@/components/Game";
import { LobbyList } from "@/components/LobbyList";
import { CreateLobby } from "@/components/CreateLobby";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { baseUrl } from "@/api";
import { api } from "@/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Lobby } from "@/types";
import { Crown } from "lucide-react";

export default function App() {
  const { user, token, logout } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verified, setVerified] = useState<string | null>(null);
  const pathname = usePathname();
  const [page, setPage] = useState<"auth" | "lobby" | "game">("auth");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [subPage, setSubPage] = useState<"list" | "create" | "waiting" | null>(
    null
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVerified(searchParams.get("verified"));
    }
  }, [searchParams]);

  const [phase, setPhase] = useState<"selection" | "guessing" | "results">(
    "selection"
  );
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<"Win" | "Lose" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [connectedError, setConnectedError] = useState<boolean>(false);

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    if (verified !== null) {
      if (verified == "true") {
        toast.success("Your email has been verified");
      } else {
        toast.error("Your email couldn't be verified");
      }

      const params = new URLSearchParams(searchParams);
      params.delete("verified");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams, verified]);

  useEffect(() => {
    if (token) {
      fetchLobbies();
      setPage("lobby");
    }
    if (!token || ws) return;

    const current_ws = new WebSocket(`${baseUrl}/ws/game?token=${token}`);
    setWs(current_ws);

    current_ws.onopen = () => {
      current_ws.send(JSON.stringify({ type: "sign" }));
    };

    current_ws.onmessage = (event) => {
      const message = JSON.parse(event.data.toString());
      console.log("Received message:", message);

      switch (message.type) {
        case "ping":
          current_ws.send(JSON.stringify({ type: "pong" }));
          break;
        case "lobby_created":
        case "lobby_joined":
          setCurrentLobby(message.lobby);
          setSubPage("waiting");
          setPhase("selection");
          break;
        case "rematch_started":
          setImages(message.images);
          setPhase("selection");
          setStatus(null);
          handleRefresh();
          break;
        case "game_started":
          setImages(message.images);
          setPage("game");
          break;
        case "player_joined":
        case "player_left":
        case "player_ready_changed":
        case "end_turn":
        case "update_lobby":
        case "player_kicked":
          setCurrentLobby(message.lobby);
          break;
        case "new_lobby":
          setLobbies(message.public_lobbies);
          break;
        case "selection_complete":
          setPhase("guessing");
          break;
        case "incorrect_guess":
          toast.error("Wrong guess! Try again.");
          break;
        case "correct_guess":
          toast.success("Correct guess!");
          setStatus("Win");
          setPhase("results");
          break;
        case "player_scored":
          setStatus("Lose");
          setPhase("results");
          break;
        case "kicked":
          toast.error("You have been kicked from the lobby.");
          setPage("lobby");
          setCurrentLobby(null);
          setSubPage(null);
          setStatus(null);
          break;
        case "lobby_closed":
          setPage("lobby");
          setCurrentLobby(null);
          setSubPage(null);
          setStatus(null);
          break;
        case "start_failed":
        case "join_failed":
          toast.error(message.reason || "Failed to start the game.");
          break;
        case "player_left_in_results":
          toast.error("The other player has left the game.");
          setPage("lobby");
          setCurrentLobby(null);
          setSubPage(null);
          setStatus(null);
          break;
        case "connected_error":
          toast.error(message.message || "Connection error.");
          setConnectedError(true);
          break;
        default:
          console.warn("Unknown message type:", message.type);
      }
    };

    current_ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    current_ws.onclose = () => {
      console.log("WebSocket connection closed");

      // setWs(null);
    };

    return () => {
      if (current_ws) current_ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchLobbies = async () => {
    try {
      const result = await api.get("/lobbies");
      setLobbies(result.data.public_lobbies);
    } catch (error) {
      console.error("Failed to fetch lobbies:", error);
    }
  };

  const handleCreateLobby = (data: {
    maxImages: number;
    lobbyName: string;
    password: string | null;
    isPrivate: boolean;
  }) => {
    ws?.send(
      JSON.stringify({
        type: "create_lobby",
        ...data,
      })
    );
  };

  const handleJoinLobby = (lobbyId: string, hasPassword: boolean) => {
    const password = hasPassword ? prompt("Enter lobby password:") : null;
    ws?.send(
      JSON.stringify({
        type: "join_lobby",
        lobby_id: lobbyId,
        password,
      })
    );
  };

  const handleAuthSuccess = () => {
    setPage("lobby");
    fetchLobbies();
  };

  const handleReadyClick = () => {
    ws?.send(JSON.stringify({ type: "ready", ready: true }));
  };

  const handleStartGame = () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    if (currentLobby?.player_count! < 2) {
      toast.error("At least 2 players are required to start the game.");
      return;
    }
    ws?.send(JSON.stringify({ type: "start_game" }));
  };

  const handleRematch = () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    if (currentLobby?.player_count! < 2) {
      toast.error("At least 2 players are required to start the game.");
      return;
    }
    ws?.send(JSON.stringify({ type: "start_game", isRematch: true }));
    setStatus(null);
    setPhase("selection");
  };

  const handleCharacterDiscard = (character: string) => {
    ws?.send(JSON.stringify({ type: "discard_character", character }));
  };

  const handleOwnCharacterSelect = (character: string) => {
    ws?.send(JSON.stringify({ type: "select_own_character", character }));
  };

  const handleGuessCharacter = (character: string) => {
    if (user?.user_id !== currentLobby?.user_turn) {
      toast.error("It's not your turn!");
      return;
    }
    ws?.send(JSON.stringify({ type: "guess", character }));
  };

  const handleEndTurn = () => {
    if (user?.user_id !== currentLobby?.user_turn) {
      toast.error("It's not your turn!");
      return;
    }
    ws?.send(JSON.stringify({ type: "end_turn" }));
    toast.success("It's now the other player's turn.");
  };

  const handleLeaveGameInResults = () => {
    ws?.send(JSON.stringify({ type: "leave_lobby", in_result: true }));
    setPage("lobby");
    setCurrentLobby(null);
    setSubPage(null);
    setStatus(null);
  };
  const handleLeaveGame = () => {
    ws?.send(JSON.stringify({ type: "leave_lobby" }));
    setPage("lobby");
    setCurrentLobby(null);
    setSubPage(null);
    setStatus(null);
  };

  if (page === "auth") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8
                   bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950 text-gray-900 dark:text-white"
      >
        <DarkModeToggle />
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div>
            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center text-4xl font-extrabold tracking-tight text-gradient"
            >
              Khawawish
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 text-center text-xl text-gray-600 dark:text-gray-400"
            >
              The Guessing Game
            </motion.h2>
          </div>

          <div className="mt-8 bg-surfacel-500 dark:bg-surfaced-500 p-8 rounded-xl shadow-xl">
            <div className="flex justify-center space-x-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAuthMode("login")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors
                  ${
                    authMode === "login"
                      ? "bg-primary-500 text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
              >
                Login
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAuthMode("register")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors
                  ${
                    authMode === "register"
                      ? "bg-primary-500 text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
              >
                Register
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: authMode === "login" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: authMode === "login" ? 20 : -20 }}
                transition={{ duration: 0.2 }}
              >
                {authMode === "login" ? (
                  <Login
                    onSuccess={handleAuthSuccess}
                    username={username}
                    setUsername={setUsername}
                    password={password}
                    setPassword={setPassword}
                  />
                ) : (
                  <Register
                    onSuccess={handleAuthSuccess}
                    username={username}
                    setUsername={setUsername}
                    password={password}
                    setPassword={setPassword}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (page === "lobby") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-tr from-emerald-50 via-indigo-50 to-violet-50 dark:from-emerald-950 dark:via-indigo-950 dark:to-violet-950 text-gray-900 dark:text-white p-8 pr-16"
      >
        <DarkModeToggle />
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <motion.h1
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="text-3xl font-bold text-gradient"
            >
              Khawawish: The Guessing Game
            </motion.h1>
            <motion.div
              initial={{ x: 20 }}
              animate={{ x: 0 }}
              className="flex items-center space-x-4"
            >
              <span className="text-sm">Welcome, {user?.display_name}</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Logout
              </motion.button>
            </motion.div>
          </div>

          {subPage === "waiting" && currentLobby ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-surfacel-500 dark:bg-surfaced-500 p-8 rounded-xl shadow-xl"
            >
              <h2 className="text-2xl font-bold mb-6">Waiting Room</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium">
                    Lobby: {currentLobby.lobby_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Players: {currentLobby.player_count}/2
                  </p>
                </div>

                {/* Players List */}
                <div className="mt-4 space-y-2">
                  <h3 className="text-xl font-semibold">Players</h3>
                  {currentLobby.owner && (
                    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Crown className="text-yellow-500" />
                        <span>{currentLobby.owner.display_name}</span>
                        {currentLobby.owner.is_ready && (
                          <span className="text-green-500 text-sm">
                            (Ready)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {currentLobby.second_player && (
                    <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>{currentLobby.second_player.display_name}</span>
                        {currentLobby.second_player.is_ready && (
                          <span className="text-green-500 text-sm">
                            (Ready)
                          </span>
                        )}
                      </div>
                      {user?.user_id === currentLobby.owner?.user_id && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            ws?.send(
                              JSON.stringify({
                                type: "kick_player",
                                user_id: currentLobby.second_player?.user_id,
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
                    {user?.user_id === currentLobby.owner?.user_id && (
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-surfacel-500 dark:bg-surfaced-500 p-8 rounded-xl shadow-xl"
              >
                <CreateLobby
                  in_game={user?.in_game || connectedError}
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
                  in_game={user?.in_game || connectedError}
                  lobbies={lobbies}
                  onJoinLobby={handleJoinLobby}
                />
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[game-bg-light] dark:bg-darkb-500">
      <DarkModeToggle />
      <Game
        key={refreshKey}
        images={images}
        onDiscardCharacter={handleCharacterDiscard}
        onOwnCharacterSelect={handleOwnCharacterSelect}
        onGuessCharacter={handleGuessCharacter}
        onEndTurn={handleEndTurn}
        onLeaveGame={handleLeaveGameInResults}
        onRematch={handleRematch}
        phase={phase}
        gameStatus={status}
        currentLobby={currentLobby}
      />
    </div>
  );
}
