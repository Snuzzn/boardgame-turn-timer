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
import { groupApi, gameApi, playerApi, playthroughApi } from "@/lib/api"

export const useLeaderboard = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [playthroughs, setPlaythroughs] = useState<Playthrough[]>([])
  const [loading, setLoading] = useState(false)
  const [gameLoading, setGameLoading] = useState(false)
  const [playthroughLoading, setPlaythroughLoading] = useState(false)

  // Load initial data
  useEffect(() => {
    loadGroups()
  }, [])

  // Load games and players when group is selected
  useEffect(() => {
    if (selectedGroupId) {
      loadGamesForGroup(selectedGroupId)
      loadPlayersForGroup(selectedGroupId)
    } else {
      setGames([])
      setPlayers([])
      setSelectedGameId(null)
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
      const response = await groupApi.getGroups()
      console.timeEnd("Load Groups")
      if (response.success && response.data) {
        setGroups(response.data)
      } else {
        console.error("Failed to load groups:", response.error)
      }
    } catch (error) {
      console.error("Failed to load groups:", error)
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
      }
    } catch (error) {
      console.error("Failed to load games:", error)
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
      }
    } catch (error) {
      console.error("Failed to load players:", error)
    }
  }

  const loadPlaythroughsForGame = async (gameId: string) => {
    setPlaythroughLoading(true)
    try {
      console.time("Load Playthroughs")
      const response = await playthroughApi.getPlaythroughsForGame(gameId)
      console.timeEnd("Load Playthroughs")
      if (response.success && response.data) {
        console.log("Loaded playthroughs:", response.data) // Debug log
        setPlaythroughs(response.data)
      } else {
        console.error("Failed to load playthroughs:", response.error)
      }
    } catch (error) {
      console.error("Failed to load playthroughs:", error)
    } finally {
      setPlaythroughLoading(false)
    }
  }

  const createGroup = async (name: string, description?: string): Promise<Group> => {
    console.time("Create Group")
    const response = await groupApi.createGroup(name, description)
    console.timeEnd("Create Group")
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create group")
    }

    await loadGroups() // Refresh groups list
    return response.data
  }

  const joinGroup = async (code: string): Promise<Group> => {
    console.time("Join Group")
    const response = await groupApi.joinGroup(code)
    console.timeEnd("Join Group")
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to join group")
    }

    await loadGroups() // Refresh groups list
    return response.data
  }

  const createGame = async (groupId: string, name: string): Promise<Game> => {
    console.time("Create Game")
    const response = await gameApi.createGame(groupId, name)
    console.timeEnd("Create Game")
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create game")
    }

    await loadGamesForGroup(groupId) // Refresh games list
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
      throw new Error(response.error || "Failed to create playthrough")
    }

    console.log("Playthrough created successfully:", response.data)

    // Refresh both playthroughs and players
    await Promise.all([
      loadPlaythroughsForGame(gameId),
      selectedGroupId ? loadPlayersForGroup(selectedGroupId) : Promise.resolve(),
    ])

    return response.data
  }

  const deletePlaythrough = async (gameId: string, playthroughId: string): Promise<boolean> => {
    try {
      console.time("Delete Playthrough")
      const response = await playthroughApi.deletePlaythrough(gameId, playthroughId)
      console.timeEnd("Delete Playthrough")

      if (!response.success) {
        throw new Error(response.error || "Failed to delete playthrough")
      }

      // Update local state to remove the deleted playthrough
      setPlaythroughs((prev) => prev.filter((p) => p.id !== playthroughId))
      return true
    } catch (error) {
      console.error("Failed to delete playthrough:", error)
      return false
    }
  }

  const getLeaderboardForGame = useCallback(
    (gameId: string | null): GameLeaderboard | null => {
      if (!gameId) return null

      const game = games.find((g) => g.id === gameId)
      if (!game) return null

      const gamePlaythroughs = playthroughs.filter((p) => p.game_id === gameId)
      console.log("Game playthroughs for leaderboard:", gamePlaythroughs) // Debug log

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
    [games, playthroughs],
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
    playthroughs, // Export playthroughs directly

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
  }
}
