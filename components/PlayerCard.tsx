"use client"

import type React from "react"
import { Play, Clock, Plus, GripVertical, AlertTriangle, Edit2, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Player } from "@/types"
import { formatTime, getTurnProgressColor } from "@/utils"

const AVAILABLE_COLORS = [
  {
    value: "blue",
    label: "Blue",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    bar: "bg-blue-500",
  },
  {
    value: "green",
    label: "Green",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    bar: "bg-green-500",
  },
  {
    value: "purple",
    label: "Purple",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    bar: "bg-purple-500",
  },
  {
    value: "orange",
    label: "Orange",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    bar: "bg-orange-500",
  },
  { 
    value: "red", 
    label: "Red", 
    bg: "bg-red-50", 
    border: "border-red-200", 
    text: "text-red-700", 
    bar: "bg-red-500" 
  },
  {
    value: "indigo",
    label: "Indigo",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    bar: "bg-indigo-500",
  },
  {
    value: "pink",
    label: "Pink",
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    bar: "bg-pink-500",
  },
  {
    value: "teal",
    label: "Teal",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    bar: "bg-teal-500",
  },
]

interface PlayerCardProps {
  player: Player
  isActive: boolean
  currentTurnTime: number
  gameStarted: boolean
  initialTime: number
  showAdjustButtons: boolean
  showColorSelectors: boolean
  editingPlayer: number | null
  editName: string
  onPlayerClick: (playerId: number) => void
  onDragStart: (playerId: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (targetPlayerId: number) => void
  onAdjustTime: (playerId: number, adjustment: number) => void
  onUpdateName: (playerId: number, newName: string) => void
  onUpdateColor: (playerId: number, newColor: string) => void
  onStartEdit: (playerId: number, currentName: string) => void
  onSetEditName: (name: string) => void
}

const getPlayerColorStyles = (color: string) => {
  const colorOption = AVAILABLE_COLORS.find((c) => c.value === color) || AVAILABLE_COLORS[0]
  return colorOption
}

export const PlayerCard = ({
  player,
  isActive,
  currentTurnTime,
  gameStarted,
  initialTime,
  showAdjustButtons,
  showColorSelectors,
  editingPlayer,
  editName,
  onPlayerClick,
  onDragStart,
  onDragOver,
  onDrop,
  onAdjustTime,
  onUpdateName,
  onUpdateColor,
  onStartEdit,
  onSetEditName,
}: PlayerCardProps) => {
  
  const colors = getPlayerColorStyles(player.color)
  const turnProgressColor = getTurnProgressColor(currentTurnTime)
  const isOvertime = currentTurnTime > 60

  // Calculate remaining time percentage for turn progress bar
  const turnTimeRemaining = Math.max(0, 60 - currentTurnTime)
  const turnProgressPercentage = (turnTimeRemaining / 60) * 100

  return (
    <Card
      draggable
      onDragStart={(e) => {
        onDragStart(player.id)
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(player.id)
      }}
      onClick={() => onPlayerClick(player.id)}
      className={`transition-all duration-300 cursor-pointer touch-manipulation h-full ${
        isActive
          ? "border-4 border-amber-500 bg-gradient-to-br from-amber-100 to-orange-100 shadow-xl"
          : player.isOutOfRound
            ? `border-2 border-gray-300 bg-gray-100 opacity-60`
            : `border-2 ${colors.border} bg-white hover:shadow-md active:scale-[0.99]`
      }`}
      style={{
        // Ensure consistent rendering and no height variations
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        borderWidth: isActive ? "4px" : "2px",
        borderStyle: "solid",
        minHeight: "100%",
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab touch-none" />
            {editingPlayer === player.id ? (
              <Input
                value={editName}
                onChange={(e) => onSetEditName(e.target.value)}
                onBlur={() => onUpdateName(player.id, editName)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUpdateName(player.id, editName)
                  }
                  if (e.key === "Escape") {
                    onStartEdit(-1, "")
                  }
                }}
                className="text-xl font-semibold w-32"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className={`text-xl ${isActive ? "text-amber-800" : "text-gray-700"}`}>
                  {player.name}
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartEdit(player.id, player.name)
                  }}
                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100 touch-manipulation"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {player.isOutOfRound && <Badge className="bg-gray-500 text-white text-xs">Round Complete</Badge>}
            {player.isRevealing && <Badge className="bg-purple-500 text-white text-xs">Revealing</Badge>}
            {isActive && isOvertime && (
              <Badge className="bg-red-500 text-white text-xs animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overtime
              </Badge>
            )}
            {isActive && !player.isOutOfRound && (
              <Badge className="bg-amber-500 text-white text-xs">
                <Play className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Color Selection */}
          {showColorSelectors && (
            <div className="flex items-center gap-2">
              <Label className="text-sm text-gray-600">Color:</Label>
              <Select value={player.color} onValueChange={(value) => onUpdateColor(player.id, value)}>
                <SelectTrigger className="w-24 h-8" onClick={(e) => e.stopPropagation()}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color.bar}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Main Timer */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div
                className={`text-3xl md:text-4xl font-mono font-bold ${
                  player.timeRemaining < 60
                    ? "text-red-600"
                    : player.timeRemaining < 180
                      ? "text-orange-600"
                      : "text-green-600"
                }`}
              >
                {formatTime(player.timeRemaining)}
              </div>
              {isActive && gameStarted && !player.isOutOfRound && (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <Plus className="w-4 h-4" />
                  <span>1:00</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">Time Remaining</p>

            {/* Manual Time Adjustment */}
            {showAdjustButtons && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAdjustTime(player.id, -60)
                  }}
                  className="h-8 w-8 p-0 touch-manipulation"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-xs text-gray-500 px-2">Adjust</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAdjustTime(player.id, 60)
                  }}
                  className="h-8 w-8 p-0 touch-manipulation"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Turn Progress Bar (for active player) */}
          {isActive && gameStarted && !player.isOutOfRound && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Turn Progress</span>
                <span>{Math.min(60 - currentTurnTime, 60)}/60s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${turnProgressColor} ${
                    isOvertime ? "animate-pulse" : ""
                  }`}
                  style={{ width: `${Math.max(0, turnProgressPercentage)}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className={`rounded-lg p-3 ${player.currentTurnEfficiency >= 0 ? colors.bg : "bg-red-50"}`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className={`w-4 h-4 ${player.currentTurnEfficiency >= 0 ? colors.text : "text-red-600"}`} />
                <span
                  className={`text-xs md:text-sm font-medium ${player.currentTurnEfficiency >= 0 ? colors.text : "text-red-700"}`}
                >
                  Turn Efficiency
                </span>
              </div>
              <div
                className={`text-lg font-bold ${player.currentTurnEfficiency >= 0 ? colors.text : "text-red-800"}`}
              >
                {player.currentTurnEfficiency >= 0 ? "+ " : "- "}
                {formatTime(Math.abs(player.currentTurnEfficiency))}
                {Math.abs(player.currentTurnEfficiency) >= 60 ? "m" : "s"}
              </div>
            </div>

            <div className={`rounded-lg p-3 ${colors.bg}`}>
              <div className={`text-xs md:text-sm font-medium ${colors.text} mb-1`}>Turns</div>
              <div className={`text-lg font-bold ${colors.text}`}>{player.turnsCompleted}</div>
            </div>
          </div>

          {/* Overall Time Status Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                player.timeRemaining < 60 ? "bg-red-500" : player.timeRemaining < 180 ? "bg-orange-500" : colors.bar
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (player.timeRemaining / initialTime) * 100))}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
