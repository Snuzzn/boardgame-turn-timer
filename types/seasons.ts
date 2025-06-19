export interface Season {
  id: string
  group_id: string
  season_number: number
  start_date: string
  end_date?: string
  status: "active" | "concluded"
  min_games_threshold: number
  total_playthroughs: number
  created_at: string
}

export interface SeasonBadge {
  id: string
  season_id: string
  player_id: string
  player_name: string
  rank: number
  badge_type: "champion" | "runner_up" | "bronze" | "fourth"
  total_games: number
  win_rate: number
  awarded_at: string
}

export interface SeasonSummary {
  season: Season
  badges: SeasonBadge[]
  canConclude: boolean
  topPlayers: {
    playerId: string
    playerName: string
    totalGames: number
    firstPlaces: number
    winRate: number
    averageRank: number
  }[]
}
