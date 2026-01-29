export interface Player {
    id: number
    name: string
    timeRemaining: number // in seconds
    totalEfficiency: number // cumulative efficiency across all turns
    currentTurnEfficiency: number // efficiency for current turn only
    turnsCompleted: number
    isActive: boolean
    color: string // unique color for each player
    isRevealing: boolean // true if in reveal phase
    isOutOfRound: boolean // true if finished with round (after reveal)
}

export interface GameState {
    players: Player[]
    isRunning: boolean
    turnStartTime: number | null
    gameStarted: boolean
    currentRound: number
    initialTime: number
    showSettings: boolean
    showAdjustButtons: boolean
    showColorSelectors: boolean
    editingPlayer: number | null
    editName: string
    draggedPlayer: number | null
}

export interface ColorOption {
    value: string
    label: string
    bg: string
    border: string
    text: string
    bar: string
}

export type HostState = {
    sentAt: number
    players: Array<{
        id: number
        name: string
        color?: string
        isActive: boolean
        isRevealing: boolean
        timeRemaining: number
        isOutOfRound: boolean
    }>
    currentRound: number
    isRunning: boolean
    gameStarted: boolean
}
