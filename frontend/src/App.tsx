import { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { Game } from "./components/Game";
import { LobbyList } from "./components/LobbyList";
import { CreateLobby } from "./components/CreateLobby";
import { api, baseUrl } from "./api";
import { Lobby } from "./types";

export default function App() {
  const { user, token, logout } = useAuth();
  const [page, setPage] = useState<"auth" | "lobby" | "game">("auth");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [subPage, setSubPage] = useState<"list" | "create" | "waiting" | null>(
    null
  );
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (token) {
      fetchLobbies();
      setPage("lobby");
    }
    if (!token) return;
    const ws = new WebSocket(`${baseUrl}/ws/game?token=${token}`);
    setWs(ws);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "sign" }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data.toString());
      console.log("Received message:", message);

      switch (message.type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        case "lobby_created":
        case "lobby_joined":
          setCurrentLobby(message.lobby);
          setSubPage("waiting");
          break;
        case "game_started":
          setImages(message.images);
          setPage("game");
          break;
        case "player_joined":
        case "player_left":
        case "player_ready_changed":
          setCurrentLobby(message.lobby);
          break;
        case "new_lobby":
          setLobbies(message.public_lobbies);
          break;
        default:
          console.warn("Unknown message type:", message.type);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
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
    ws?.send(JSON.stringify({ type: "start_game" }));
  };

  const handleCharacterSelect = (character: string) => {
    ws?.send(JSON.stringify({ type: "select_character", character }));
  };

  const handleOwnCharacterSelect = (character: string) => {
    ws?.send(JSON.stringify({ type: "select_own_character", character }));
  };

  if (page === "auth") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome to Khawawish
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {authMode === "login"
                ? "Sign in to your account"
                : "Create a new account"}
            </p>
          </div>

          {authMode === "login" ? (
            <Login onSuccess={handleAuthSuccess} />
          ) : (
            <Register onSuccess={handleAuthSuccess} />
          )}

          <div className="text-center">
            <button
              className="text-blue-600 hover:text-blue-500"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            >
              {authMode === "login"
                ? "Need an account? Register"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (page === "lobby") {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Khawawish: The Guessing Game</h1>
            <div className="flex items-center space-x-4">
              <span>Welcome, {user?.display_name}</span>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => {
                  logout();
                  window.location.reload();
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {subPage === "waiting" && currentLobby ? (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Waiting Room</h2>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2">
                    Lobby: {currentLobby.lobby_name}
                  </h3>
                  <p className="text-gray-600">
                    Share ID: {currentLobby.lobby_id}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-2">Players:</h4>
                  <div className="space-y-2">
                    {Object.entries(currentLobby.players).map(
                      ([id, player]) => (
                        <div
                          key={id}
                          className="flex items-center justify-between"
                        >
                          <span>{player.display_name}</span>
                          <span
                            className={
                              player.is_ready
                                ? "text-green-500"
                                : "text-gray-500"
                            }
                          >
                            {player.is_ready ? "Ready" : "Not Ready"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                    onClick={handleReadyClick}
                  >
                    Ready
                  </button>
                  {currentLobby.creator_id === user?.user_id && (
                    <button
                      className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600"
                      onClick={handleStartGame}
                    >
                      Start Game
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Create New Lobby</h2>
                <CreateLobby onCreateLobby={handleCreateLobby} />
              </div>
              <div>
                <LobbyList lobbies={lobbies} onJoinLobby={handleJoinLobby} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <Game
        images={images}
        onSelectCharacter={handleCharacterSelect}
        onOwnCharacterSelect={handleOwnCharacterSelect}
      />
    </div>
  );
}
