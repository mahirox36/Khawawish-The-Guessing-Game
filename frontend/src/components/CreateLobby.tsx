import { useState } from 'react';

interface CreateLobbyProps {
  onCreateLobby: (data: {
    maxImages: number;
    lobbyName: string;
    password: string | null;
    isPrivate: boolean;
  }) => void;
}

export function CreateLobby({ onCreateLobby }: CreateLobbyProps) {
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
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label htmlFor="lobbyName" className="block text-sm font-medium text-gray-700">
          Lobby Name
        </label>
        <input
          type="text"
          id="lobbyName"
          value={lobbyName}
          onChange={(e) => setLobbyName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="maxImages" className="block text-sm font-medium text-gray-700">
          Max Characters
        </label>
        <input
          type="number"
          id="maxImages"
          value={maxImages}
          onChange={(e) => setMaxImages(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          min={5}
          max={100}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password (optional)
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPrivate"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
          Private Lobby
        </label>
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Create Lobby
      </button>
    </form>
  );
}