import { Lobby } from '../types';

interface LobbyListProps {
  lobbies: Lobby[];
  onJoinLobby: (lobbyId: string, hasPassword: boolean) => void;
}

export function LobbyList({ lobbies, onJoinLobby }: LobbyListProps) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Available Lobbies</h2>
      <div className="max-h-96 overflow-y-auto w-full max-w-2xl">
        {lobbies.length > 0 ? (
          lobbies.map((lobby) => (
            <div
              key={lobby.lobby_id}
              className="border p-4 mb-4 rounded-md w-full"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{lobby.lobby_name}</h3>
                  <p className="text-sm text-gray-600">ID: {lobby.lobby_id}</p>
                  <p className="text-sm text-gray-600">Players: {lobby.player_count}</p>
                  <p className="text-sm text-gray-600">Max Images: {lobby.max_images}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {lobby.has_password && (
                    <span className="text-yellow-500">🔒</span>
                  )}
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                    onClick={() => onJoinLobby(lobby.lobby_id, lobby.has_password)}
                  >
                    Join Lobby
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No lobbies available. Create one!</p>
        )}
      </div>
    </div>
  );
}