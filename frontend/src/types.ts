export interface User {
  user_id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  games_played: number;
  games_won: number;
  games_lose: number;
  total_score: number;
  best_streak: number;
  current_streak: number;
  in_game: boolean;
  is_active: boolean;
  is_verified: boolean;
  toast_user: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  win_rate: number;
  average_score: number;
}

export interface Player {
  user_id: string;
  username: string;
  display_name: string;
  is_ready: boolean;
}

export interface Lobby {
  lobby_id: string;
  lobby_name: string;
  max_images: number;
  seed: string;
  owner: Player | null;
  second_player: Player | null;
  has_password: boolean;
  is_private: boolean;
  creator_id: string;
  created_at: string;
  game_started: boolean;
  user_turn: string;
  player_count: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginError {
  status: number;
  detail: string;
}
