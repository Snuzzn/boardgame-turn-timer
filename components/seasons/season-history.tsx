"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Trophy, Target, ChevronDown, ChevronUp } from "lucide-react"
import { SeasonBadgeComponent } from "./season-badge"
import { Spinner } from "@/components/ui/spinner"
import type { Season, SeasonBadge } from "@/types/seasons"

interface SeasonHistoryProps {
  groupId: string
  onFetchSeasons: (groupId: string) => Promise<Season[]>
  onFetchSeasonBadges: (groupId: string, seasonId: string) => Promise<SeasonBadge[]>
}

export const SeasonHistory = ({ groupId, onFetchSeasons, onFetchSeasonBadges }: SeasonHistoryProps) => {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonBadges, setSeasonBadges] = useState<Record<string, SeasonBadge[]>>({})
  const [loading, setLoading] = useState(true)
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSeasons()
  }, [groupId])

  const loadSeasons = async () => {
    setLoading(true)
    try {
      const seasonsData = await onFetchSeasons(groupId)
      setSeasons(seasonsData)
    } catch (error) {
      console.error("Failed to load seasons:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSeasonBadges = async (seasonId: string) => {
    if (seasonBadges[seasonId]) return // Already loaded

    try {
      const badges = await onFetchSeasonBadges(groupId, seasonId)
      setSeasonBadges((prev) => ({ ...prev, [seasonId]: badges }))
    } catch (error) {
      console.error("Failed to load season badges:", error)
    }
  }

  const toggleSeasonExpanded = (seasonId: string) => {
    const newExpanded = new Set(expandedSeasons)
    if (newExpanded.has(seasonId)) {
      newExpanded.delete(seasonId)
    } else {
      newExpanded.add(seasonId)
      loadSeasonBadges(seasonId) // Load badges when expanding
    }
    setExpandedSeasons(newExpanded)
  }

  const activeSeason = seasons.find((s) => s.status === "active")
  const concludedSeasons = seasons
    .filter((s) => s.status === "concluded")
    .sort((a, b) => b.season_number - a.season_number)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Season History</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading season history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Season History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="concluded" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="concluded">Past Seasons ({concludedSeasons.length})</TabsTrigger>
            <TabsTrigger value="current">Current Season</TabsTrigger>
          </TabsList>

          <TabsContent value="concluded" className="space-y-4">
            {concludedSeasons.length > 0 ? (
              concludedSeasons.map((season) => (
                <Card key={season.id} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Trophy className="w-5 h-5 text-amber-600" />
                        <div>
                          <h3 className="font-semibold">Season {season.season_number}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(season.start_date).toLocaleDateString()} -{" "}
                            {season.end_date ? new Date(season.end_date).toLocaleDateString() : "Ongoing"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-green-400 text-green-700">
                          Concluded
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => toggleSeasonExpanded(season.id)}>
                          {expandedSeasons.has(season.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSeasons.has(season.id) && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-slate-800">{season.total_playthroughs}</div>
                          <div className="text-xs text-slate-600">Total Games</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-slate-800">
                            {season.end_date
                              ? Math.ceil(
                                  (new Date(season.end_date).getTime() - new Date(season.start_date).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                )
                              : "N/A"}
                          </div>
                          <div className="text-xs text-slate-600">Duration (Days)</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-slate-800">{seasonBadges[season.id]?.length || 0}</div>
                          <div className="text-xs text-slate-600">Badges Awarded</div>
                        </div>
                      </div>

                      {seasonBadges[season.id] && seasonBadges[season.id].length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <Trophy className="w-4 h-4 mr-2 text-amber-600" />
                            Badge Winners
                          </h4>
                          <div className="space-y-2">
                            {seasonBadges[season.id]
                              .sort((a, b) => a.rank - b.rank)
                              .map((badge) => (
                                <div
                                  key={badge.id}
                                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                      {badge.rank}
                                    </div>
                                    <div>
                                      <div className="font-medium">{badge.player_name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {badge.total_games} games • {badge.win_rate}% win rate
                                      </div>
                                    </div>
                                  </div>
                                  <SeasonBadgeComponent badge={badge} size="sm" />
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Past Seasons</h3>
                <p className="text-slate-500">Complete your first season to see history here!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="current">
            {activeSeason ? (
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-5 h-5 text-amber-600" />
                      <div>
                        <h3 className="font-semibold text-amber-800">Season {activeSeason.season_number}</h3>
                        <p className="text-sm text-amber-600">
                          Started {new Date(activeSeason.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-amber-400 text-amber-700">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-lg font-bold text-amber-800">{activeSeason.total_playthroughs}</div>
                      <div className="text-xs text-amber-600">Games Played</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-lg font-bold text-amber-800">
                        {Math.ceil(
                          (new Date().getTime() - new Date(activeSeason.start_date).getTime()) / (1000 * 60 * 60 * 24),
                        )}
                      </div>
                      <div className="text-xs text-amber-600">Days Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No Active Season</h3>
                <p className="text-slate-500">Start playing games to begin your first season!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
