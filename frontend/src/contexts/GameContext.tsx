"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { api, baseUrl } from "@/api";
import { usePathname, useRouter } from "next/navigation";
import { Lobby } from "@/types";

type GameContextType = {
  images: string[];
  phase: "selection" | "guessing" | "results";
  status: "Win" | "Lose" | null;
  lobbies: Lobby[];
  currentLobby: Lobby | null;
  ws: WebSocket | null;
  refreshKey: number;
  connectedError: boolean;
  selectedIndexes: string[];
  ownImage: string | null;
  isShiftHeld: boolean;
  setSelectedIndexes: Dispatch<SetStateAction<string[]>>;
  setOwnImage: (ownImage: string) => void;
  handleCharacterDiscard: (character: string) => void;
  handleOwnCharacterSelect: (character: string) => void;
  handleRefresh: () => void;
  handleCreateLobby: (data: {
    maxImages: number;
    lobbyName: string;
    password: string | null;
    isPrivate: boolean;
  }) => void;
  handleJoinLobby: (lobbyId: string, hasPassword: boolean) => void;
  handleAuthSuccess: () => void;
  handleReadyClick: () => void;
  handleStartGame: () => void;
  handleRematch: () => void;
  handleGuessCharacter: (character: string) => void;
  handleEndTurn: () => void;
  handleLeaveGameInResults: () => void;
  handleLeaveGame: () => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<"selection" | "guessing" | "results">(
    "selection"
  );
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<"Win" | "Lose" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [connectedError, setConnectedError] = useState<boolean>(false);
  const handleRefresh = () => setRefreshKey((prev) => prev + 1);
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>([]);
  const [ownImage, setOwnImage] = useState<string | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftHeld(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const okPages = ["/login", "/"];
    const gamePages = ["/lobby", "/game"];
    const isOkPage =
      okPages.includes(pathname) || pathname.startsWith("/profile");
    if (!token && !isOkPage) {
      router.replace("/login");
    } else if (!currentLobby && gamePages.includes(pathname)) {
      router.replace("/rooms");
    } else if (!currentLobby && pathname === "/game") {
      router.push("/rooms");
    }
  }, [pathname, token, router, currentLobby]);

  useEffect(() => {
    if (user?.toast_user === true && user?.is_verified) {
      toast.success("Your email has been verified");
    }

    if (!token || ws) return;

    (async () => {
      await fetchLobbies();
    })();

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
          router.push("/lobby");
          setPhase("selection");
          break;
        case "rematch_started":
          setImages([]);
          setSelectedIndexes([]);
          setOwnImage(null);
          setImages(message.images);
          setPhase("selection");
          setStatus(null);
          handleRefresh();
          break;
        case "game_started":
          setImages(message.images);
          router.push("/game");
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
          router.push("/rooms");
          setCurrentLobby(null);
          setStatus(null);
          break;
        case "lobby_closed":
          router.push("/rooms");
          setCurrentLobby(null);
          setStatus(null);
          break;
        case "start_failed":
        case "join_failed":
          toast.error(message.reason || "Failed to start the game.");
          break;
        case "player_left_in_results":
          toast.error("The other player has left the game.");
          router.push("/rooms");
          setCurrentLobby(null);
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
    router.push("/rooms");
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
    setImages([]);
    setSelectedIndexes([]);
    setOwnImage(null);
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
    router.push("/rooms");
    setCurrentLobby(null);
    setStatus(null);
  };
  const handleLeaveGame = () => {
    ws?.send(JSON.stringify({ type: "leave_lobby" }));
    router.push("/rooms");
    setCurrentLobby(null);
    setStatus(null);
  };

  return (
    <GameContext.Provider
      value={{
        images,
        phase,
        status,
        lobbies,
        currentLobby,
        ws,
        refreshKey,
        connectedError,
        selectedIndexes,
        setSelectedIndexes,
        ownImage,
        setOwnImage,
        isShiftHeld,
        handleCharacterDiscard,
        handleOwnCharacterSelect,
        handleRefresh,
        handleCreateLobby,
        handleJoinLobby,
        handleAuthSuccess,
        handleReadyClick,
        handleStartGame,
        handleRematch,
        handleGuessCharacter,
        handleEndTurn,
        handleLeaveGameInResults,
        handleLeaveGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
