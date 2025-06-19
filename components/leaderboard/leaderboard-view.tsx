"use client"

import type { GameLeaderboard } from "@/types/leaderboard"
import type { SeasonSummary } from "@/types/seasons"
import { AddPlaythroughForm } from "./add-playthrough-form"
import { PlayerRankingCard } from "./player-ranking-card"
import { PlaythroughHistory } from "./playthrough-history"
import { SeasonManagementPanel } from "../seasons/season-management-panel"
import { SeasonHistory } from "../seasons/season-history"
import { BarChart3, Trophy, Lock, Users, History, Crown } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

interface LeaderboardViewProps {
  leaderboardData: GameLeaderboard | null
  existingPlayers: any[]
  playthroughs: any[]
  currentSeasonSummary: SeasonSummary | null
  onAddPlaythrough: (gameId: string, results: any[]) => void
  onDeletePlaythrough: (gameId: string, playthroughId: string) => Promise<boolean>
  onConcludeSeason: () => Promise<void>
  onFetchSeasons: (groupId: string) => Promise<any[]>
  onFetchSeasonBadges: (groupId: string, seasonId: string) => Promise<any[]>
  loading?: boolean
  playthroughLoading?: boolean
  seasonLoading?: boolean
  groupId?: string
}

export const LeaderboardView = ({
  leaderboardData,
  existingPlayers,
  playthroughs,
  currentSeasonSummary,
  onAddPlaythrough,
  onDeletePlaythrough,
  onConcludeSeason,
  onFetchSeasons,
  onFetchSeasonBadges,
  loading = false,
  playthroughLoading = false,
  seasonLoading = false,
  groupId,
}: LeaderboardViewProps) => {
  const [activeTab, setActiveTab] = useState<string>("rankings")

  if (loading) {
    return (
      <div className="text-center py-16">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Loading leaderboard data...</p>
      </div>
    )
  }

  if (!leaderboardData) {
    return (
      <div className="text-center py-10">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Select a game to view its leaderboard or join a game using a code.</p>
      </div>
    )
  }

  const { game, rankings } = leaderboardData

  const handlePlaythroughSubmit = (results: any[]) => {
    onAddPlaythrough(game.id, results)
  }

  const handleDeletePlaythrough = async (playthroughId: string) => {
    return await onDeletePlaythrough(game.id, playthroughId)
  }

  return (
    <div className="space-y-8">
      <header className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Trophy className="w-8 h-8 mr-3 text-amber-500" />
              {game.name} Leaderboard
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-sm text-muted-foreground">
                Game in group • Created {new Date(game.created_at).toLocaleDateString()}
              </div>
              {currentSeasonSummary && (
                <div className="flex items-center text-sm text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                  <Crown className="w-3 h-3 mr-1" />
                  Season {currentSeasonSummary.season.season_number}
                </div>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {existingPlayers.length} registered players
            </div>
          </div>
        </div>
      </header>

      {/* Season Management Panel */}
      {currentSeasonSummary && (
        <SeasonManagementPanel
          seasonSummary={currentSeasonSummary}
          onConcludeSeason={onConcludeSeason}
          loading={seasonLoading}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto mb-6">
          <TabsTrigger value="rankings" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="seasons" className="flex items-center">
            <Crown className="w-4 h-4 mr-2" />
            Seasons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-sky-600" />
                Player Rankings
                {currentSeasonSummary && (
                  <span className="ml-2 text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    Season {currentSeasonSummary.season.season_number}
                  </span>
                )}
              </h2>
              {rankings.length > 0 ? (
                <div className="space-y-4">
                  {rankings.map((playerRanking) => (
                    <PlayerRankingCard key={playerRanking.playerId} playerRanking={playerRanking} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No playthroughs recorded for this game yet. Add one below!</p>
              )}
            </section>

            <section className="sticky top-4">
              <AddPlaythroughForm
                gameId={game.id}
                gameName={game.name}
                existingPlayers={existingPlayers}
                onSubmit={handlePlaythroughSubmit}
              />
            </section>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <PlaythroughHistory
            playthroughs={playthroughs}
            gameId={game.id}
            onDeletePlaythrough={handleDeletePlaythrough}
            loading={playthroughLoading}
          />
        </TabsContent>

        <TabsContent value="seasons">
          {groupId ? (
            <SeasonHistory
              groupId={groupId}
              onFetchSeasons={onFetchSeasons}
              onFetchSeasonBadges={onFetchSeasonBadges}
            />
          ) : (
            <div className="text-center py-10">
              <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Season history not available.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
