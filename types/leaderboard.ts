export interface Group {
  id: string
  name: string
  code: string // Unique access code for the group
  created_at: string // Change from number to string since it comes from database as ISO string
  created_by: string // User identifier
  description?: string
}

export interface Game {
  id: string
  name: string
  group_id: string // Games belong to groups
  created_at: string // Change from number to string
  created_by: string
}

export interface Player {
  id: string
  name: string
  group_id: string // Players are group-specific, can play multiple games
  created_at: string // Change from number to string
}

export interface PlaythroughPlayerResult {
  playerId: string
  playerName: string
  rank: number
}

export interface Playthrough {
  id: string
  game_id: string
  group_id: string
  timestamp: string // Change from number to string
  results: PlaythroughPlayerResult[]
  recorded_by: string // User who recorded this playthrough
}

// Derived data for displaying a player on the main leaderboard for a game
export interface PlayerRanking {
  playerId: string
  playerName: string
  chips: number[] // An array of ranks, e.g., [1, 3, 1, 2]
  rankCounts: {
    first: number
    second: number
    third: number
    fourth: number
    other: number
  }
  totalPlaythroughs: number
  overallRank?: number
}

// Data for displaying the full leaderboard of a specific game
export interface GameLeaderboard {
  game: Game
  rankings: PlayerRanking[]
}

// Group access management
export interface GroupAccess {
  groupId: string
  hasAccess: boolean
  accessedAt: number
  role: "member" | "admin" // Future: different permission levels
}

// Group overview with all games
export interface GroupOverview {
  group: Group
  games: Game[]
  totalPlayers: number
  totalPlaythroughs: number
}
