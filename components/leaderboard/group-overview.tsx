"use client"

import type { GroupOverview } from "@/types/leaderboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Gamepad2, Trophy, Plus, Calendar, BarChart3, Loader2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useState } from "react"
import { formatGroupCode } from "@/utils/group-code-utils"

interface GroupOverviewProps {
  overview: GroupOverview | null
  onSelectGame: (gameId: string) => void
  onCreateGame: () => void
  loading?: boolean
}

const GroupOverviewComponent = ({ overview, onSelectGame, onCreateGame, loading = false }: GroupOverviewProps) => {
  const [loadingGameId, setLoadingGameId] = useState<string | null>(null)

  if (!overview) {
    return (
      <div className="text-center py-10">
        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Select a group to view its games and leaderboards.</p>
      </div>
    )
  }

  const { group, games, totalPlayers, totalPlaythroughs } = overview

  const handleGameSelect = async (gameId: string) => {
    setLoadingGameId(gameId)
    // Add a small delay to show the loading state
    setTimeout(() => {
      onSelectGame(gameId)
      setLoadingGameId(null)
    }, 100)
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Loading group overview...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-2xl font-bold">{group.name}</h2>
          <Badge variant="outline" className="font-mono text-sm">
            {formatGroupCode(group.code)}
          </Badge>
        </div>
        {group.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            {totalPlayers} players
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Trophy className="w-4 h-4 mr-1" />
            {totalPlaythroughs} total games played
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-1" />
            Since {new Date(group.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Gamepad2 className="w-5 h-5 mr-2" />
            Games ({games.length})
          </h3>
          <Button onClick={onCreateGame} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Game
          </Button>
        </div>

        {games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <Card
                key={game.id}
                className="cursor-pointer hover:shadow-md transition-shadow relative"
                onClick={() => handleGameSelect(game.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{game.name}</span>
                    {loadingGameId === game.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Added {new Date(game.created_at).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {loadingGameId === game.id ? "Loading..." : "View Leaderboard"}
                  </Badge>
                </CardContent>
                {loadingGameId === game.id && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                    <Spinner size="md" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No games yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first game to start tracking leaderboards for your group.
              </p>
              <Button onClick={onCreateGame}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Game
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export { GroupOverviewComponent as GroupOverview }
export default GroupOverviewComponent
