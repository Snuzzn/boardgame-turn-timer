"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trophy, Calendar, Users, Target, Sparkles, Crown, Loader2 } from "lucide-react"
import { SeasonBadgeComponent } from "./season-badge"
import type { SeasonSummary } from "@/types/seasons"
import { toast } from "sonner"

interface SeasonManagementPanelProps {
  seasonSummary: SeasonSummary | null
  onConcludeSeason: () => Promise<void>
  loading?: boolean
}

export const SeasonManagementPanel = ({
  seasonSummary,
  onConcludeSeason,
  loading = false,
}: SeasonManagementPanelProps) => {
  const [showConcludeDialog, setShowConcludeDialog] = useState(false)
  const [concluding, setConcluding] = useState(false)

  if (!seasonSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Season Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active season found.</p>
        </CardContent>
      </Card>
    )
  }

  const { season, canConclude, topPlayers } = seasonSummary
  const progressPercentage = Math.min((season.total_playthroughs / season.min_games_threshold) * 100, 100)

  const handleConcludeSeason = async () => {
    setConcluding(true)
    try {
      await onConcludeSeason()
      setShowConcludeDialog(false)
      toast.success(`Season ${season.season_number} concluded! 🎉`, {
        description: "Badges have been awarded and a new season has begun!",
      })
    } catch (error) {
      toast.error("Failed to conclude season")
    } finally {
      setConcluding(false)
    }
  }

  return (
    <>
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="w-5 h-5 mr-2 text-amber-600" />
              Season {season.season_number}
            </div>
            <Badge variant="outline" className="border-amber-400 text-amber-700">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Season Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-700">Season Progress</span>
              <span className="text-sm text-amber-600">
                {season.total_playthroughs} / {season.min_games_threshold} games
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-3 bg-amber-100 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-orange-500"
            />
            <p className="text-xs text-amber-600 mt-1">
              {canConclude
                ? "✅ Season ready to conclude!"
                : `${season.min_games_threshold - season.total_playthroughs} more games needed`}
            </p>
          </div>

          {/* Season Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/60 rounded-lg p-3">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-bold text-amber-800">
                {Math.ceil((new Date().getTime() - new Date(season.start_date).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-amber-600">Days Active</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-bold text-amber-800">{topPlayers.length}</div>
              <div className="text-xs text-amber-600">Active Players</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <div className="flex items-center justify-center mb-1">
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-bold text-amber-800">{season.total_playthroughs}</div>
              <div className="text-xs text-amber-600">Total Games</div>
            </div>
          </div>

          {/* Current Leaderboard Preview */}
          {topPlayers.length > 0 && (
            <div>
              <h4 className="font-semibold text-amber-800 mb-3 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Current Season Leaders
              </h4>
              <div className="space-y-2">
                {topPlayers.slice(0, 4).map((player, index) => (
                  <div
                    key={player.playerId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300"
                        : "bg-white/60"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          index === 0
                            ? "bg-yellow-500 text-yellow-900"
                            : index === 1
                              ? "bg-gray-400 text-gray-800"
                              : index === 2
                                ? "bg-orange-500 text-orange-900"
                                : "bg-purple-500 text-purple-900"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-amber-800">{player.playerName}</div>
                        <div className="text-xs text-amber-600">
                          {player.totalGames} games • {player.winRate}% win rate
                        </div>
                      </div>
                    </div>
                    {index === 0 && <Crown className="w-4 h-4 text-yellow-600" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conclude Season Button */}
          <div className="pt-4 border-t border-amber-200">
            <Button
              onClick={() => setShowConcludeDialog(true)}
              disabled={!canConclude || loading}
              className={`w-full ${
                canConclude
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : canConclude ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Conclude Season & Award Badges
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Need {season.min_games_threshold - season.total_playthroughs} More Games
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conclude Season Dialog */}
      <AlertDialog open={showConcludeDialog} onOpenChange={setShowConcludeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-amber-600" />
              Conclude Season {season.season_number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will conclude the current season and award badges to the top 4 players based on their performance.
            </AlertDialogDescription>

            {topPlayers.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
                <div className="font-semibold text-amber-800 mb-2">Badge Recipients:</div>
                <div className="space-y-2">
                  {topPlayers.slice(0, 4).map((player, index) => {
                    const badgeTypes = ["champion", "runner_up", "bronze", "fourth"] as const
                    return (
                      <div key={player.playerId} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{player.playerName}</span>
                        <SeasonBadgeComponent
                          badge={{
                            id: "",
                            season_id: season.id,
                            player_id: player.playerId,
                            player_name: player.playerName,
                            rank: index + 1,
                            badge_type: badgeTypes[index],
                            total_games: player.totalGames,
                            win_rate: player.winRate,
                            awarded_at: new Date().toISOString(),
                          }}
                          size="sm"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground mt-4">
              A new season will automatically begin after this one concludes.
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={concluding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConcludeSeason}
              disabled={concluding}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {concluding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Concluding...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Conclude Season
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
