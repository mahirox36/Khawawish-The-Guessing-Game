export interface User {
  user_id: string;
  username: string;
  display_name: string;
  email: string;
  games_played: number;
  games_won: number;
  created_at: string;
}

export interface Lobby {
  lobby_id: string;
  lobby_name: string;
  max_images: number;
  seed: string;
  players: Record<string, {
    username: string;
    display_name: string;
    is_ready: boolean;
    score: number;
  }>;
  has_password: boolean;
  is_private: boolean;
  creator_id: string;
  created_at: string;
  game_started: boolean;
  player_count: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}