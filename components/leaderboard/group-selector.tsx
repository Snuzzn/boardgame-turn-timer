"use client"

import type React from "react"

import { useState } from "react"
import type { Group } from "@/types/leaderboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, PlusSquare, Key, Copy, Check, Calendar, Loader2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { formatGroupCode } from "@/utils/group-code-utils"
import { toast } from "sonner"

interface GroupSelectorProps {
  groups: Group[]
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
  onCreateGroup: (name: string, description?: string) => Promise<Group | undefined>
  onJoinGroup: (code: string) => Promise<Group | undefined>
  loading?: boolean
}

export const GroupSelector = ({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onJoinGroup,
  loading = false,
}: GroupSelectorProps) => {
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [groupCode, setGroupCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!newGroupName.trim()) {
      setError("Group name cannot be empty.")
      return
    }

    setCreateLoading(true)
    try {
      const newGroup = await onCreateGroup(newGroupName.trim(), newGroupDescription.trim() || undefined)
      if (newGroup) {
        setNewGroupName("")
        setNewGroupDescription("")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create group.")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!groupCode.trim()) {
      setError("Group code cannot be empty.")
      return
    }

    setJoinLoading(true)
    try {
      const group = await onJoinGroup(groupCode.trim())
      if (group) {
        setGroupCode("")
      }
    } catch (err: any) {
      setError(err.message || "Failed to join group.")
    } finally {
      setJoinLoading(false)
    }
  }

  const copyGroupCode = async (code: string, groupId: string) => {
    try {
      await navigator.clipboard.writeText(formatGroupCode(code))
      setCopiedGroupId(groupId)
      toast.success("Group code copied to clipboard!")
      setTimeout(() => setCopiedGroupId(null), 2000)
    } catch (err) {
      toast.error("Failed to copy group code")
    }
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  return (
    <div className="mb-8">
      <Tabs defaultValue="select" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="select">Select Group</TabsTrigger>
          <TabsTrigger value="create">Create Group</TabsTrigger>
          <TabsTrigger value="join">Join Group</TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Your Friend Groups
              </CardTitle>
              <CardDescription>
                Select a group to view games and leaderboards, or manage group activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Spinner size="lg" className="mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading your groups...</p>
                </div>
              ) : groups.length > 0 ? (
                <div className="space-y-4">
                  <Select value={selectedGroupId || undefined} onValueChange={onSelectGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <span className="font-medium">{group.name}</span>
                              {group.description && (
                                <p className="text-xs text-muted-foreground">{group.description}</p>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedGroup && (
                    <div className="p-4 bg-slate-50 rounded-md border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{selectedGroup.name}</h3>
                          {selectedGroup.description && (
                            <p className="text-sm text-muted-foreground mt-1">{selectedGroup.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Created {new Date(selectedGroup.created_at).toLocaleDateString()}
                            </div>
                            <div>
                              Code:{" "}
                              <code className="bg-slate-200 px-1 rounded">{formatGroupCode(selectedGroup.code)}</code>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyGroupCode(selectedGroup.code, selectedGroup.id)}
                          className="ml-2"
                        >
                          {copiedGroupId === selectedGroup.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No groups available. Create a new group or join an existing one to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusSquare className="mr-2 h-5 w-5" />
                Create Friend Group
              </CardTitle>
              <CardDescription>
                Create a group to track leaderboards across multiple games with your friends.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="new-group-name">Group Name</Label>
                  <Input
                    id="new-group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Board Game Night Crew"
                    disabled={createLoading}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="new-group-description">Description (Optional)</Label>
                  <Textarea
                    id="new-group-description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="e.g., Weekly board game sessions with college friends"
                    rows={2}
                    disabled={createLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createLoading || !newGroupName.trim()}>
                  {createLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Group...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5" />
                Join Friend Group
              </CardTitle>
              <CardDescription>
                Enter a 6-character group code to join an existing friend group and access their game leaderboards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinGroup} className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="group-code">Group Code</Label>
                  <Input
                    id="group-code"
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    placeholder="e.g., ABC-123 or ABC123"
                    className="font-mono"
                    disabled={joinLoading}
                  />
                  <p className="text-xs text-muted-foreground">Format: ABC-123 (dashes are optional)</p>
                </div>
                <Button type="submit" className="w-full" disabled={joinLoading || !groupCode.trim()}>
                  {joinLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining Group...
                    </>
                  ) : (
                    "Join Group"
                  )}
                </Button>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
