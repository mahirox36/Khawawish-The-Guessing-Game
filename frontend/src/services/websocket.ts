import { GameStatus, Player, Character } from './api'

// Import API_URL from api.ts
import { API_URL } from './api'

export interface GameState {
    status: GameStatus
    current_player?: Player | null
    current_turn_player_id?: number | null
    players: Player[]
    is_questioner: boolean
    selected_character?: Character
    remaining_time?: number
}

// Message Types
interface BaseMessage {
    type: string
}

export interface ReadyMessage extends BaseMessage {
    type: 'ready'
}

export interface GuessMessage extends BaseMessage {
    type: 'guess'
    target_player_id: number
    character_id: string
}

export interface QuestionMessage extends BaseMessage {
    type: 'question'
    question: string
    target_player_id: number
}

export interface TurnEndMessage extends BaseMessage {
    type: 'turn_end'
}

type WebSocketMessage = ReadyMessage | GuessMessage | QuestionMessage | TurnEndMessage

// Server Event Types
interface BaseEvent {
    type: string
}

export interface ConnectionEstablishedEvent extends BaseEvent {
    type: 'connection_established'
    player_id: number
    room_code: string
}

export interface PlayerConnectedEvent extends BaseEvent {
    type: 'player_connected'
    player_id: number
    player_info?: Player
}

export interface PlayerDisconnectedEvent extends BaseEvent {
    type: 'player_disconnected'
    player_id: number
}

export interface HostDisconnectedEvent extends BaseEvent {
    type: 'host_disconnected'
    message: string
}

export interface PlayerReadyEvent extends BaseEvent {
    type: 'player_ready'
    player_id: number
}

export interface RoundStartEvent extends BaseEvent {
    type: 'round_start'
}

export interface GameStateUpdateEvent extends BaseEvent {
    type: 'game_state_update'
    status: GameStatus
    players: Player[]
}

export interface TurnEndedEvent extends BaseEvent {
    type: 'turn_ended'
    player_id: number
}

export interface GameOverEvent extends BaseEvent {
    type: 'game_over'
    winner_id: number
}

export interface QuestionAskedEvent extends BaseEvent {
    type: 'question_asked'
    player_id: number
    target_player_id: number
    question: string
}

export interface GuessMadeEvent extends BaseEvent {
    type: 'guess_made'
    player_id: number
    target_player_id: number
    character_id: string
    is_correct: boolean
}

export interface CharacterSelectedEvent extends BaseEvent {
    type: 'character_selected'
    player_id: number
}

type WebSocketServerEvent =
    | ConnectionEstablishedEvent
    | PlayerConnectedEvent
    | PlayerDisconnectedEvent
    | HostDisconnectedEvent
    | PlayerReadyEvent
    | RoundStartEvent
    | GameStateUpdateEvent
    | TurnEndedEvent
    | GameOverEvent
    | QuestionAskedEvent
    | GuessMadeEvent
    | CharacterSelectedEvent

type EventHandler<T extends WebSocketServerEvent> = (event: T) => void
type MessageHandler = (message: string) => void

export class GameWebSocket {
    private ws: WebSocket
    private eventHandlers: Map<string, ((event: WebSocketServerEvent) => void)[]> = new Map()
    private messageHandlers: MessageHandler[] = []
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000 // Start with 1 second
    private roomCode: string
    private playerId: number
    private isClosing = false // Track if the socket is being intentionally closed

    constructor(roomCode: string, playerId: number) {
        this.roomCode = roomCode
        this.playerId = playerId
        this.ws = this.connect()
    }

    private connect(): WebSocket {
        // Use the same base URL as the API
        const wsUrl = API_URL.replace(/^http/, 'ws')
        const ws = new WebSocket(`${wsUrl}/ws/${this.roomCode}/${this.playerId}`)

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as WebSocketServerEvent
                this.handleEvent(data)
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
                // Handle raw text messages
                this.messageHandlers.forEach(handler => handler(event.data))
            }
        }

        ws.onclose = (event) => {
            console.log('WebSocket closed:', event)
            if (!this.isClosing && this.reconnectAttempts < this.maxReconnectAttempts) {
                // Exponential backoff for reconnection attempts
                const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
                console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
                setTimeout(() => {
                    this.reconnectAttempts++
                    this.ws = this.connect()
                }, delay)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        ws.onopen = () => {
            console.log('WebSocket connected successfully')
            this.reconnectAttempts = 0
            this.reconnectDelay = 1000
        }

        return ws
    }

    private handleEvent(event: WebSocketServerEvent) {
        const handlers = this.eventHandlers.get(event.type) || []
        handlers.forEach(handler => handler(event))

        // For text-based messages (questions, chat, etc.)
        if ('message' in event) {
            this.messageHandlers.forEach(handler => handler(event.message as string))
        }
    }

    public on<T extends WebSocketServerEvent>(
        eventType: T['type'],
        handler: EventHandler<T>
    ): void {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, [])
        }
        // Cast handler to accept WebSocketServerEvent, but only call with correct type
        this.eventHandlers.get(eventType)?.push(handler as EventHandler<WebSocketServerEvent>)
    }

    public onMessage(handler: MessageHandler): void {
        this.messageHandlers.push(handler)
    }

    public send(message: WebSocketMessage): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        } else {
            console.error('WebSocket is not connected')
        }
    }

    public close(): void {
        this.isClosing = true // Prevent reconnection attempts
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.close()
        }
        this.eventHandlers.clear()
        this.messageHandlers = []
    }
}