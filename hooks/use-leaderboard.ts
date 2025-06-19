"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  Group,
  Game,
  Player,
  Playthrough,
  PlayerRanking,
  GameLeaderboard,
  GroupOverview,
} from "@/types/leaderboard"
import type { SeasonSummary } from "@/types/seasons"
import { groupApi, gameApi, playerApi, playthroughApi, seasonApi } from "@/lib/api"
import { groupStorage } from "@/lib/group-storage"
import { track } from "@vercel/analytics/react"

export const useLeaderboard = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [playthroughs, setPlaythroughs] = useState<Playthrough[]>([])
  const [currentSeasonSummary, setCurrentSeasonSummary] = useState<SeasonSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [gameLoading, setGameLoading] = useState(false)
  const [playthroughLoading, setPlaythroughLoading] = useState(false)
  const [seasonLoading, setSeasonLoading] = useState(false)

  // Track page visit on mount
  useEffect(() => {
    track("page_visited", { page: "leaderboard" })
  }, [])

  // Load initial data
  useEffect(() => {
    loadGroups()
  }, [])

  // Load games, players, and season data when group is selected
  useEffect(() => {
    if (selectedGroupId) {
      loadGamesForGroup(selectedGroupId)
      loadPlayersForGroup(selectedGroupId)
      loadCurrentSeason(selectedGroupId)
    } else {
      setGames([])
      setPlayers([])
      setSelectedGameId(null)
      setCurrentSeasonSummary(null)
    }
  }, [selectedGroupId])

  // Load playthroughs when game is selected
  useEffect(() => {
    if (selectedGameId) {
      loadPlaythroughsForGame(selectedGameId)
    } else {
      setPlaythroughs([])
    }
  }, [selectedGameId])

  const loadGroups = async () => {
    setLoading(true)
    try {
      console.time("Load Groups")

      const allowedGroupIds = groupStorage.getStoredGroupIds()
      console.log("Allowed group IDs from localStorage:", allowedGroupIds)

      const response = await groupApi.getGroups(allowedGroupIds)
      console.timeEnd("Load Groups")

      if (response.success && response.data) {
        console.log("Loaded groups:", response.data)
        setGroups(response.data)
      } else {
        console.error("Failed to load groups:", response.error)
        track("error_occurred", { error_type: "load_groups_failed", error_message: response.error })
      }
    } catch (error) {
      console.error("Failed to load groups:", error)
      track("error_occurred", {
        error_type: "load_groups_failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadGamesForGroup = async (groupId: string) => {
    setGameLoading(true)
    try {
      console.time("Load Games")
      const response = await gameApi.getGamesForGroup(groupId)
      console.timeEnd("Load Games")
      if (response.success && response.data) {
        setGames(response.data)
      } else {
        console.error("Failed to load games:", response.error)
        track("error_occurred", { error_type: "load_games_failed", error_message: response.error })
      }
    } catch (error) {
      console.error("Failed to load games:", error)
      track("error_occurred", {
        error_type: "load_games_failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setGameLoading(false)
    }
  }

  const loadPlayersForGroup = async (groupId: string) => {
    try {
      console.time("Load Players")
      const response = await playerApi.getPlayersForGroup(groupId)
      console.timeEnd("Load Players")
      if (response.success && response.data) {
        setPlayers(response.data)
      } else {
        console.error("Failed to load players:", response.error)
        track("error_occurred", { error_type: "load_players_failed", error_message: response.error })
      }
    } catch (error) {
      console.error("Failed to load players:", error)
      track("error_occurred", {
        error_type: "load_players_failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const loadPlaythroughsForGame = async (gameId: string) => {
    setPlaythroughLoading(true)
    try {
      console.time("Load Playthroughs")
      const response = await playthroughApi.getPlaythroughsForGame(gameId)
      console.timeEnd("Load Playthroughs")
      if (response.success && response.data) {
        console.log("Loaded playthroughs:", response.data)
        setPlaythroughs(response.data)
      } else {
        console.error("Failed to load playthroughs:", response.error)
        track("error_occurred", { error_type: "load_playthroughs_failed", error_message: response.error })
      }
    } catch (error) {
      console.error("Failed to load playthroughs:", error)
      track("error_occurred", {
        error_type: "load_playthroughs_failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setPlaythroughLoading(false)
    }
  }

  const loadCurrentSeason = async (groupId: string) => {
    setSeasonLoading(true)
    try {
      console.time("Load Current Season")
      const response = await seasonApi.getCurrentSeason(groupId)
      console.timeEnd("Load Current Season")
      if (response.success && response.data) {
        setCurrentSeasonSummary(response.data)
      } else {
        console.error("Failed to load current season:", response.error)
        track("error_occurred", { error_type: "load_season_failed", error_message: response.error })
      }
    } catch (error) {
      console.error("Failed to load current season:", error)
      track("error_occurred", {
        error_type: "load_season_failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSeasonLoading(false)
    }
  }

  const createGroup = async (name: string, description?: string): Promise<Group> => {
    console.time("Create Group")
    const response = await groupApi.createGroup(name, description)
    console.timeEnd("Create Group")
    if (!response.success || !response.data) {
      track("error_occurred", { error_type: "create_group_failed", error_message: response.error })
      throw new Error(response.error || "Failed to create group")
    }

    // Store the group code when creating a group
    groupStorage.storeGroupCode(response.data.id, response.data.code, response.data.name)
    console.log("Stored group code for created group:", response.data.id)

    // Track group creation
    track("group_created", { group_name_length: response.data.name.length })

    await loadGroups()
    return response.data
  }

  const joinGroup = async (code: string): Promise<Group> => {
    console.time("Join Group")
    const response = await groupApi.joinGroup(code)
    console.timeEnd("Join Group")
    if (!response.success || !response.data) {
      track("error_occurred", { error_type: "join_group_failed", error_message: response.error })
      throw new Error(response.error || "Failed to join group")
    }

    // Store the group code when joining a group
    groupStorage.storeGroupCode(response.data.id, response.data.code, response.data.name)
    console.log("Stored group code for joined group:", response.data.id)

    // Track group join
    track("group_joined", { has_description: !!response.data.description })

    await loadGroups()
    return response.data
  }

  const createGame = async (groupId: string, name: string): Promise<Game> => {
    console.time("Create Game")
    const response = await gameApi.createGame(groupId, name)
    console.timeEnd("Create Game")
    if (!response.success || !response.data) {
      track("error_occurred", { error_type: "create_game_failed", error_message: response.error })
      throw new Error(response.error || "Failed to create game")
    }

    // Track game creation
    track("game_created", { game_name_length: response.data.name.length, has_group: !!response.data.group_id })

    await loadGamesForGroup(groupId)
    return response.data
  }

  const addPlaythrough = async (
    gameId: string,
    results: { playerName: string; rank: number }[],
  ): Promise<Playthrough> => {
    console.time("Add Playthrough")
    console.log("Adding playthrough for game:", gameId, "with results:", results)

    const response = await playthroughApi.createPlaythrough(gameId, results)
    console.timeEnd("Add Playthrough")

    if (!response.success || !response.data) {
      track("error_occurred", { error_type: "add_playthrough_failed", error_message: response.error })
      throw new Error(response.error || "Failed to create playthrough")
    }

    console.log("Playthrough created successfully:", response.data)

    // Track playthrough addition
    track("playthrough_added", { player_count: results.length, has_game: !!gameId })

    // Refresh playthroughs, players, and season data
    await Promise.all([
      loadPlaythroughsForGame(gameId),
      selectedGroupId ? loadPlayersForGroup(selectedGroupId) : Promise.resolve(),
      selectedGroupId ? loadCurrentSeason(selectedGroupId) : Promise.resolve(),
    ])

    return response.data
  }

  const deletePlaythrough = async (gameId: string, playthroughId: string): Promise<boolean> => {
    try {
      console.time("Delete Playthrough")
      const response = await playthroughApi.deletePlaythrough(gameId, playthroughId)
      console.timeEnd("Delete Playthrough")

      if (!response.success) {
        track("error_occurred", { error_type: "delete_playthrough_failed", error_message: response.error })
        throw new Error(response.error || "Failed to delete playthrough")
      }

      // Track playthrough deletion
      track("playthrough_deleted")

      // Update local state and refresh season data
      setPlaythroughs((prev) => prev.filter((p) => p.id !== playthroughId))
      if (selectedGroupId) {
        loadCurrentSeason(selectedGroupId)
      }
      return true
    } catch (error) {
      console.error("Failed to delete playthrough:", error)
      track("error_occurred", {
        error_type: "delete_playthrough_failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      return false
    }
  }

  const concludeSeason = async (): Promise<void> => {
    if (!selectedGroupId) throw new Error("No group selected")

    console.time("Conclude Season")
    const response = await seasonApi.concludeSeason(selectedGroupId)
    console.timeEnd("Conclude Season")

    if (!response.success) {
      track("error_occurred", { error_type: "conclude_season_failed", error_message: response.error })
      throw new Error(response.error || "Failed to conclude season")
    }

    // Track season conclusion
    track("season_concluded", { season_number: response.data?.seasonNumber })

    // Refresh season data and playthroughs to get the new season
    await Promise.all([
      loadCurrentSeason(selectedGroupId),
      selectedGameId ? loadPlaythroughsForGame(selectedGameId) : Promise.resolve(),
    ])
  }

  const fetchSeasons = async (groupId: string): Promise<any[]> => {
    const response = await seasonApi.getSeasons(groupId)
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch seasons")
    }
    return response.data
  }

  const fetchSeasonBadges = async (groupId: string, seasonId: string): Promise<any[]> => {
    const response = await seasonApi.getSeasonBadges(groupId, seasonId)
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch season badges")
    }
    return response.data
  }

  const leaveGroup = (groupId: string) => {
    // Remove group code from localStorage
    groupStorage.removeGroupCode(groupId)
    console.log("Removed group code for group:", groupId)

    // If this was the selected group, deselect it
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null)
    }

    // Refresh groups list
    loadGroups()
  }

  const getLeaderboardForGame = useCallback(
    (gameId: string | null): GameLeaderboard | null => {
      if (!gameId) return null

      const game = games.find((g) => g.id === gameId)
      if (!game) return null

      // Filter playthroughs by current season if available
      let gamePlaythroughs = playthroughs.filter((p) => p.game_id === gameId)

      // If we have current season data, only show playthroughs from current season
      if (currentSeasonSummary?.season) {
        gamePlaythroughs = gamePlaythroughs.filter((p) => p.season_id === currentSeasonSummary.season.id)
        console.log(
          "Filtered playthroughs for current season:",
          currentSeasonSummary.season.season_number,
          gamePlaythroughs,
        )
      }

      console.log("Game playthroughs for leaderboard:", gamePlaythroughs)

      const playerStats: Record<
        string,
        {
          playerId: string
          playerName: string
          chips: number[]
          rankCounts: PlayerRanking["rankCounts"]
          totalPlaythroughs: number
        }
      > = {}

      gamePlaythroughs.forEach((playthrough) => {
        if (playthrough.results && Array.isArray(playthrough.results)) {
          playthrough.results.forEach((result: any) => {
            if (!playerStats[result.playerId]) {
              playerStats[result.playerId] = {
                playerId: result.playerId,
                playerName: result.playerName,
                chips: [],
                rankCounts: { first: 0, second: 0, third: 0, fourth: 0, other: 0 },
                totalPlaythroughs: 0,
              }
            }
            playerStats[result.playerId].chips.push(result.rank)
            playerStats[result.playerId].totalPlaythroughs++
            if (result.rank === 1) playerStats[result.playerId].rankCounts.first++
            else if (result.rank === 2) playerStats[result.playerId].rankCounts.second++
            else if (result.rank === 3) playerStats[result.playerId].rankCounts.third++
            else if (result.rank === 4) playerStats[result.playerId].rankCounts.fourth++
            else playerStats[result.playerId].rankCounts.other++
          })
        }
      })

      let rankedPlayers: PlayerRanking[] = Object.values(playerStats).map((stats) => ({
        playerId: stats.playerId,
        playerName: stats.playerName,
        chips: stats.chips,
        rankCounts: stats.rankCounts,
        totalPlaythroughs: stats.totalPlaythroughs,
      }))

      // Sort players for overall ranking
      rankedPlayers.sort((a, b) => {
        if (a.rankCounts.first !== b.rankCounts.first) return b.rankCounts.first - a.rankCounts.first
        if (a.rankCounts.second !== b.rankCounts.second) return b.rankCounts.second - a.rankCounts.second
        if (a.rankCounts.third !== b.rankCounts.third) return b.rankCounts.third - a.rankCounts.third
        if (a.rankCounts.fourth !== b.rankCounts.fourth) return b.rankCounts.fourth - a.rankCounts.fourth
        if (a.totalPlaythroughs !== b.totalPlaythroughs) return a.totalPlaythroughs - b.totalPlaythroughs
        return a.playerName.localeCompare(b.playerName)
      })

      rankedPlayers = rankedPlayers.map((player, index) => ({ ...player, overallRank: index + 1 }))

      return { game, rankings: rankedPlayers }
    },
    [games, playthroughs, currentSeasonSummary],
  )

  const getGroupOverview = useCallback(
    (groupId: string | null): GroupOverview | null => {
      if (!groupId) return null

      const group = groups.find((g) => g.id === groupId)
      if (!group) return null

      const groupGames = games.filter((g) => g.group_id === groupId)
      const groupPlayers = players.filter((p) => p.group_id === groupId)
      const groupPlaythroughs = playthroughs.filter((p) => p.group_id === groupId)

      return {
        group,
        games: groupGames,
        totalPlayers: groupPlayers.length,
        totalPlaythroughs: groupPlaythroughs.length,
      }
    },
    [groups, games, players, playthroughs],
  )

  const currentLeaderboard = getLeaderboardForGame(selectedGameId)
  const currentGroupOverview = getGroupOverview(selectedGroupId)
  const currentGroupPlayers = selectedGroupId ? players.filter((p) => p.group_id === selectedGroupId) : []

  return {
    // State
    groups,
    games,
    selectedGroupId,
    selectedGameId,
    loading,
    gameLoading,
    playthroughLoading,
    seasonLoading,
    playthroughs,
    currentSeasonSummary,

    // Computed
    currentLeaderboard,
    currentGroupOverview,
    currentGroupPlayers,

    // Actions
    createGroup,
    joinGroup,
    createGame,
    addPlaythrough,
    setSelectedGroupId,
    setSelectedGameId,
    deletePlaythrough,
    leaveGroup,
    concludeSeason,
    fetchSeasons,
    fetchSeasonBadges,
  }
}
