"use client"

import type React from "react"

import { useState } from "react"
import { useLeaderboard } from "@/hooks/use-leaderboard"
import { GroupSelector } from "@/components/leaderboard/group-selector"
import GroupOverview from "@/components/leaderboard/group-overview"
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Toaster, toast } from "sonner"

export default function LeaderboardPage() {
  const {
    groups,
    games,
    selectedGroupId,
    selectedGameId,
    loading,
    gameLoading,
    playthroughLoading,
    playthroughs, // Now properly imported
    currentLeaderboard,
    currentGroupOverview,
    currentGroupPlayers,
    createGroup,
    joinGroup,
    createGame,
    addPlaythrough,
    deletePlaythrough,
    setSelectedGroupId,
    setSelectedGameId,
  } = useLeaderboard()

  const [newGameName, setNewGameName] = useState("")
  const [showCreateGameDialog, setShowCreateGameDialog] = useState(false)
  const [gameCreateLoading, setGameCreateLoading] = useState(false)

  const handleCreateGroup = async (name: string, description?: string) => {
    try {
      const newGroup = await createGroup(name, description)
      toast.success(`Group "${newGroup.name}" created! Share code: ${newGroup.code}`)
      return newGroup
    } catch (e: any) {
      toast.error(e.message || "Error creating group.")
      return undefined
    }
  }

  const handleJoinGroup = async (code: string) => {
    try {
      const group = await joinGroup(code)
      if (group) {
        toast.success(`Successfully joined "${group.name}"!`)
        return group
      }
      return undefined
    } catch (e: any) {
      toast.error(e.message || "Error joining group.")
      return undefined
    }
  }

  const handleCreateGame = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedGroupId || !newGameName.trim()) return

    setGameCreateLoading(true)
    try {
      const newGame = await createGame(selectedGroupId, newGameName.trim())
      setNewGameName("")
      setShowCreateGameDialog(false)
      setSelectedGameId(newGame.id)
      toast.success(`Game "${newGame.name}" added to the group!`)
    } catch (e: any) {
      toast.error(e.message || "Error creating game.")
    } finally {
      setGameCreateLoading(false)
    }
  }

  const handleAddPlaythrough = async (gameId: string, results: any[]) => {
    try {
      console.log("Page: Adding playthrough for game:", gameId)
      await addPlaythrough(gameId, results)
      toast.success(`Playthrough recorded successfully!`)
    } catch (e: any) {
      console.error("Page: Error adding playthrough:", e)
      toast.error(e.message || "Error recording playthrough.")
      throw e // Re-throw to let the form handle it
    }
  }

  const handleDeletePlaythrough = async (gameId: string, playthroughId: string) => {
    try {
      const success = await deletePlaythrough(gameId, playthroughId)
      if (success) {
        toast.success("Playthrough deleted successfully")
      } else {
        toast.error("Failed to delete playthrough")
      }
      return success
    } catch (e: any) {
      toast.error(e.message || "Error deleting playthrough")
      return false
    }
  }

  const handleBackToGroup = () => {
    setSelectedGameId(null)
  }

  // Filter playthroughs for the current game
  const currentGamePlaythroughs = selectedGameId ? playthroughs.filter((p) => p.game_id === selectedGameId) : []

  console.log("Current game playthroughs:", currentGamePlaythroughs) // Debug log

  // Show game leaderboard if a game is selected
  if (selectedGameId && currentLeaderboard) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-screen bg-slate-50">
        <Toaster richColors />

        <div className="mb-6">
          <Button variant="ghost" onClick={handleBackToGroup} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {currentGroupOverview?.group.name}
          </Button>
        </div>

        <LeaderboardView
          leaderboardData={currentLeaderboard}
          existingPlayers={currentGroupPlayers}
          playthroughs={currentGamePlaythroughs}
          onAddPlaythrough={handleAddPlaythrough}
          onDeletePlaythrough={handleDeletePlaythrough}
          loading={loading}
          playthroughLoading={playthroughLoading}
        />
      </div>
    )
  }

  // Show group overview if a group is selected
  if (selectedGroupId && currentGroupOverview) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-screen bg-slate-50">
        <Toaster richColors />

        <div className="mb-6">
          <Button variant="ghost" onClick={() => setSelectedGroupId(null)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Button>
        </div>

        <GroupOverview
          overview={currentGroupOverview}
          onSelectGame={setSelectedGameId}
          onCreateGame={() => setShowCreateGameDialog(true)}
          loading={gameLoading}
        />

        {/* Create Game Dialog */}
        <Dialog open={showCreateGameDialog} onOpenChange={setShowCreateGameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Game</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGame} className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="game-name">Game Name</Label>
                <Input
                  id="game-name"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="e.g., Wingspan, Azul, Ticket to Ride"
                  disabled={gameCreateLoading}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateGameDialog(false)}
                  disabled={gameCreateLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newGameName.trim() || gameCreateLoading}>
                  {gameCreateLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Game"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Show group selection
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen bg-slate-50">
      <Toaster richColors />
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Friend Group Leaderboards</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create or join friend groups to track game leaderboards together.
        </p>
      </header>

      <GroupSelector
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
        loading={loading}
      />
    </div>
  )
}
