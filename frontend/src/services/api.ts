import axios from 'axios'

export const API_URL = 'http://127.0.0.1:8000'

export type GameMode = 'text' | 'voice'
export type GameStatus = 'waiting' | 'character_selection' | 'in_progress' | 'completed'

export interface Player {
    id: number
    name: string
    is_host: boolean
    is_spectator: boolean
    is_ready?: boolean
    has_selected_character?: boolean
}

export interface Lobby {
    code: string
    status: GameStatus
    num_characters: number
    is_private: boolean
    time_limit_seconds: number
    allow_spectators: boolean
    max_players: number
    game_mode: GameMode
    player_count: number
    players: Player[]
}

export interface CharacterAttribute {
    name: string
    value: string
}

export interface CharacterObject {
    name: string
    attributes: CharacterAttribute[]
}

export interface CharacterColor {
    name: string
}

export interface Character {
    id: string
    name: string
    summary: string
    imageUrl: string
    attributes: CharacterObject[]
    colors: CharacterColor[]
}

export interface LobbyCreateRequest {
    host_name: string
    num_characters?: number
    is_private?: boolean
    password?: string | null
    time_limit_seconds?: number
    allow_spectators?: boolean
    max_players?: number
    game_mode?: GameMode
}

export interface GuessResponse {
    message: string
    is_correct: boolean
}

export interface TurnEndResponse {
    message: string
    next_player_id: number
}

export const api = {
    // Lobby Management
    createLobby: async (data: LobbyCreateRequest): Promise<Lobby> => {
        const response = await axios.post<Lobby>(`${API_URL}/lobbies`, data)
        return response.data
    },

    getLobbies: async (): Promise<Lobby[]> => {
        const response = await axios.get<Lobby[]>(`${API_URL}/lobbies`)
        return response.data
    },

    getLobby: async (code: string): Promise<Lobby> => {
        const response = await axios.get<Lobby>(`${API_URL}/lobbies/${code}`)
        return response.data
    },

    joinLobby: async (code: string, data: {
        player_name: string
        is_spectator?: boolean
        password?: string
    }): Promise<Player> => {
        const response = await axios.post<Player>(`${API_URL}/lobbies/${code}/join`, data)
        return response.data
    },

    startGame: async (code: string, playerId: number): Promise<void> => {
        await axios.post(`${API_URL}/lobbies/${code}/start`, null, {
            params: { player_id: playerId }
        })
    },

    leaveLobby: async (code: string, playerId: number): Promise<void> => {
        await axios.post(`${API_URL}/lobbies/${code}/leave`, null, {
            params: { player_id: playerId }
        })
    },

    // Character Management
    getCharacters: async (code: string): Promise<Character[]> => {
        const response = await axios.get<Character[]>(`${API_URL}/game/lobbies/${code}/characters`)
        return response.data
    },

    selectCharacter: async (code: string, playerId: number, characterId: string): Promise<void> => {
        await axios.post(`${API_URL}/game/lobbies/${code}/select-character`, {
            character_id: characterId
        }, {
            params: { player_id: playerId }
        })
    },

    // Game Mechanics
    endTurn: async (code: string, playerId: number): Promise<TurnEndResponse> => {
        const response = await axios.post<TurnEndResponse>(
            `${API_URL}/game/lobbies/${code}/end-turn`,
            null,
            { params: { player_id: playerId } }
        )
        return response.data
    },

    makeGuess: async (code: string, playerId: number, targetPlayerId: number, characterId: string): Promise<GuessResponse> => {
        const response = await axios.post<GuessResponse>(
            `${API_URL}/game/lobbies/${code}/make-guess`,
            { target_player_id: targetPlayerId, character_id: characterId },
            { params: { player_id: playerId } }
        )
        return response.data
    },

    askQuestion: async (code: string, playerId: number, targetPlayerId: number, question: string): Promise<void> => {
        await axios.post(
            `${API_URL}/game/lobbies/${code}/ask-question`,
            { target_player_id: targetPlayerId, question },
            { params: { player_id: playerId } }
        )
    }
}