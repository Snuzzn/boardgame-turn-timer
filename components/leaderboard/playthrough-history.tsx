"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Calendar, Trash2, Users, Loader2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { getOrdinalSuffix } from "@/utils/leaderboard-utils"

interface PlaythroughHistoryProps {
  playthroughs: any[]
  gameId: string
  onDeletePlaythrough: (playthroughId: string) => Promise<boolean>
  loading?: boolean
}

export const PlaythroughHistory = ({
  playthroughs,
  gameId,
  onDeletePlaythrough,
  loading = false,
}: PlaythroughHistoryProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirmDeleteId) return

    setDeletingId(confirmDeleteId)
    const success = await onDeletePlaythrough(confirmDeleteId)
    if (success) {
      setConfirmDeleteId(null)
    }
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size="md" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Loading playthrough history...</p>
      </div>
    )
  }

  if (playthroughs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Playthrough History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No playthroughs recorded yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Playthrough History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {playthroughs.map((playthrough) => (
            <div
              key={playthrough.id}
              className="border rounded-md p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(playthrough.timestamp).toLocaleDateString()} at{" "}
                  {new Date(playthrough.timestamp).toLocaleTimeString([], { timeStyle: "short" })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmDeleteId(playthrough.id)}
                  disabled={!!deletingId}
                >
                  {deletingId === playthrough.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{playthrough.results.length} players</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {playthrough.results
                  .sort((a: any, b: any) => a.rank - b.rank)
                  .map((result: any) => (
                    <Badge
                      key={`${playthrough.id}-${result.playerId}`}
                      variant={result.rank === 1 ? "default" : "outline"}
                      className={
                        result.rank === 1
                          ? "bg-amber-500 hover:bg-amber-600"
                          : result.rank === 2
                            ? "border-gray-400 text-gray-700"
                            : result.rank === 3
                              ? "border-orange-400 text-orange-700"
                              : ""
                      }
                    >
                      {getOrdinalSuffix(result.rank)}: {result.playerName}
                    </Badge>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playthrough</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this playthrough? This action cannot be undone and will permanently remove
              this record from the leaderboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={!!deletingId}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
