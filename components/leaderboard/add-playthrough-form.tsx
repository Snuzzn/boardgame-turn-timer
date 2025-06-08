"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Trash2, Users, UserPlus, Loader2, CheckCircle } from "lucide-react"
import type { Player } from "@/types/leaderboard"
import { getOrdinalSuffix } from "@/utils/leaderboard-utils"

interface AddPlaythroughFormProps {
  gameId: string
  gameName: string
  existingPlayers: Player[]
  onSubmit: (results: { playerName: string; rank: number }[]) => Promise<void>
}

interface PlayerRankInput {
  id: string
  playerName: string
  rank: string
  isNewPlayer: boolean
}

export const AddPlaythroughForm = ({ gameId, gameName, existingPlayers, onSubmit }: AddPlaythroughFormProps) => {
  const [playerRanks, setPlayerRanks] = useState<PlayerRankInput[]>([
    { id: crypto.randomUUID(), playerName: "", rank: "1", isNewPlayer: true },
    { id: crypto.randomUUID(), playerName: "", rank: "2", isNewPlayer: true },
  ])
  const [error, setError] = useState<string | null>(null)
  const [showPlayerSuggestions, setShowPlayerSuggestions] = useState<{ [key: string]: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handlePlayerRankChange = (index: number, field: "playerName" | "rank", value: string) => {
    const updatedRanks = [...playerRanks]
    updatedRanks[index] = {
      ...updatedRanks[index],
      [field]: value,
      isNewPlayer:
        field === "playerName"
          ? !existingPlayers.some((p) => p.name.toLowerCase() === value.toLowerCase())
          : updatedRanks[index].isNewPlayer,
    }
    setPlayerRanks(updatedRanks)
    setError(null) // Clear error when user makes changes
  }

  const selectExistingPlayer = (index: number, player: Player) => {
    const updatedRanks = [...playerRanks]
    updatedRanks[index] = {
      ...updatedRanks[index],
      playerName: player.name,
      isNewPlayer: false,
    }
    setPlayerRanks(updatedRanks)
    setShowPlayerSuggestions((prev) => ({ ...prev, [updatedRanks[index].id]: false }))
  }

  const addPlayerField = () => {
    const nextRank = playerRanks.length + 1
    setPlayerRanks([
      ...playerRanks,
      {
        id: crypto.randomUUID(),
        playerName: "",
        rank: nextRank.toString(),
        isNewPlayer: true,
      },
    ])
  }

  const removePlayerField = (index: number) => {
    if (playerRanks.length <= 1) {
      setError("Must have at least one player.")
      return
    }
    const updatedRanks = playerRanks.filter((_, i) => i !== index)
    const reassignedRanks = updatedRanks.map((player, i) => ({
      ...player,
      rank: (i + 1).toString(),
    }))
    setPlayerRanks(reassignedRanks)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitSuccess(false)

    const results: { playerName: string; rank: number }[] = []
    const playerNames = new Set<string>()
    const ranks = new Set<number>()

    for (const playerRank of playerRanks) {
      if (!playerRank.playerName.trim()) {
        setError("All player names must be filled.")
        return
      }
      if (playerNames.has(playerRank.playerName.trim().toLowerCase())) {
        setError("Player names must be unique for a single playthrough.")
        return
      }
      playerNames.add(playerRank.playerName.trim().toLowerCase())

      const rank = Number.parseInt(playerRank.rank, 10)
      if (isNaN(rank) || rank < 1) {
        setError(`Invalid rank for ${playerRank.playerName}. Must be a positive number.`)
        return
      }
      if (ranks.has(rank)) {
        setError(`Rank ${getOrdinalSuffix(rank)} is assigned to multiple players. Each rank must be unique.`)
        return
      }
      ranks.add(rank)

      results.push({ playerName: playerRank.playerName.trim(), rank })
    }

    if (results.length === 0) {
      setError("Please add at least one player's rank.")
      return
    }

    const sortedRanks = [...ranks].sort((a, b) => a - b)
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        setError("Ranks must be consecutive starting from 1st place.")
        return
      }
    }

    setSubmitting(true)
    try {
      console.log("Submitting playthrough with results:", results)
      await onSubmit(results)

      // Show success state briefly
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 2000)

      // Reset form
      setPlayerRanks([
        { id: crypto.randomUUID(), playerName: "", rank: "1", isNewPlayer: true },
        { id: crypto.randomUUID(), playerName: "", rank: "2", isNewPlayer: true },
      ])
    } catch (err: any) {
      console.error("Error submitting playthrough:", err)
      setError(err.message || "Failed to submit playthrough. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getRankOptions = () => {
    return Array.from({ length: playerRanks.length }, (_, i) => i + 1)
  }

  const getFilteredPlayerSuggestions = (currentName: string) => {
    if (!currentName.trim()) return existingPlayers
    return existingPlayers.filter(
      (player) =>
        player.name.toLowerCase().includes(currentName.toLowerCase()) &&
        !playerRanks.some((pr) => pr.playerName.toLowerCase() === player.name.toLowerCase()),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Record Playthrough for {gameName}
        </CardTitle>
        <CardDescription>
          Enter player names and their final rankings. Select from existing players or add new ones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {playerRanks.map((playerRank, index) => {
            const suggestions = getFilteredPlayerSuggestions(playerRank.playerName)
            const showSuggestions = showPlayerSuggestions[playerRank.id] && suggestions.length > 0

            return (
              <div key={playerRank.id} className="space-y-2">
                <div className="flex items-end gap-3 p-3 border rounded-md bg-slate-50/50">
                  <div className="grid gap-1.5 flex-grow relative">
                    <Label htmlFor={`playerName-${index}`}>
                      Player Name
                      {playerRank.isNewPlayer && playerRank.playerName && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          <UserPlus className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id={`playerName-${index}`}
                      value={playerRank.playerName}
                      onChange={(e) => handlePlayerRankChange(index, "playerName", e.target.value)}
                      onFocus={() => setShowPlayerSuggestions((prev) => ({ ...prev, [playerRank.id]: true }))}
                      onBlur={() =>
                        setTimeout(() => setShowPlayerSuggestions((prev) => ({ ...prev, [playerRank.id]: false })), 200)
                      }
                      placeholder="e.g., Alice"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid gap-1.5 w-32">
                    <Label htmlFor={`rank-${index}`}>Final Rank</Label>
                    <Select
                      value={playerRank.rank}
                      onValueChange={(value) => handlePlayerRankChange(index, "rank", value)}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getRankOptions().map((rank) => (
                          <SelectItem key={rank} value={rank.toString()}>
                            {getOrdinalSuffix(rank)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlayerField(index)}
                    disabled={playerRanks.length <= 1 || submitting}
                    aria-label="Remove player"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                {/* Player Suggestions */}
                {showSuggestions && (
                  <div className="ml-3 mr-16 bg-white border rounded-md shadow-lg max-h-32 overflow-y-auto">
                    {suggestions.slice(0, 5).map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 border-b last:border-b-0 text-sm"
                        onMouseDown={() => selectExistingPlayer(index, player)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{player.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Existing
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" size="sm" onClick={addPlayerField} disabled={submitting}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Player
            </Button>
            <Button type="submit" disabled={submitting || submitSuccess}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording Playthrough...
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Success!
                </>
              ) : (
                "Submit Playthrough"
              )}
            </Button>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {submitting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-600 flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating playthrough and updating leaderboard...
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
