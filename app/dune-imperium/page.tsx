"use client"

import type React from "react"
import { useGameTimer } from "@/hooks/useGameTimer"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useOrientation } from "@/hooks/useOrientation"
import { Header } from "@/components/Header"
import { SettingsPanel } from "@/components/SettingsPanel"
import { ControlPanel } from "@/components/ControlPanel"
import { PlayerCard } from "@/components/PlayerCard"
import { GameInfo } from "@/components/GameInfo"
import { MobileCardNavigation } from "@/components/MobileCardNavigation"
import { PlaythroughFormSection } from "@/components/leaderboard/playthrough-form-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Home } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, } from "react"
import { Toaster } from "sonner"
import { useHostRoomSync } from "@/hooks/useHostRoomSync"

export default function DuneImperiumTimer() {

    const {
        hydrated,
        // State
        players,
        isRunning,
        gameStarted,
        currentRound,
        initialTime,
        showSettings,
        showAdjustButtons,
        showColorSelectors,
        soundEnabled,
        editingPlayer,
        editName,
        activePlayer,
        currentPlayerIndex,
        isTransitioning,
        slideDirection,
        // Computed values
        getCurrentTurnTime,
        getActivePlayersCount,
        // Actions
        startPauseTimer,
        switchToPlayer,
        nextTurn,
        previousTurn,
        startRevealTurn,
        endRound,
        resetGame,
        adjustPlayerTime,
        updatePlayerName,
        updatePlayerColor,
        handleDragStart,
        handleDrop,
        nextPlayerCard,
        previousPlayerCard,
        // Setters
        setInitialTime,
        setShowSettings,
        setShowAdjustButtons,
        setShowColorSelectors,
        setSoundEnabled,
        setEditingPlayer,
        setEditName,
        setManualNavigation,
        setCurrentPlayerIndex,
        syncSignal
    } = useGameTimer()

    const { roomCode } = useHostRoomSync({
        syncSignal,
        snapshotInputs: {
            players,
            currentRound,
            isRunning,
            gameStarted,
        },
        onNextTurn: nextTurn,
        onPauseResume: startPauseTimer,
        onRevealTurn: startRevealTurn,
    })

    const isLandscape = useOrientation()

    // Add new state for next player index
    const [nextPlayerIndex, setNextPlayerIndex] = useState(currentPlayerIndex)

    // Update currentPlayerIndex after transition is complete
    useEffect(() => {
        if (!isTransitioning) {
            setCurrentPlayerIndex(nextPlayerIndex)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTransitioning, nextPlayerIndex])

    useKeyboardShortcuts({
        onNextTurn: nextTurn,
        onPreviousTurn: previousTurn,
        onToggleTimer: startPauseTimer,
        gameStarted,
    })

    if (!hydrated) return null

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
    }

    const handleStartEdit = (playerId: number, currentName: string) => {
        setEditingPlayer(playerId)
        setEditName(currentName)
    }

    // Enhanced mobile view detection
    const isMobileView = typeof window !== "undefined" && window.innerWidth < 1024 && !isLandscape

    // Updated mobile navigation handlers to use nextPlayerIndex for transitions
    const handleMobileNext = () => {
        const currentPlayer = players[currentPlayerIndex]
        const isPaused = gameStarted && !isRunning

        if (isPaused) {
            // Directly set nextPlayerIndex for paused state
            setNextPlayerIndex((currentPlayerIndex + 1) % players.length)
            return
        }

        if (currentPlayer?.isActive && gameStarted && isRunning) {
            // Set nextPlayerIndex before calling nextTurn
            setNextPlayerIndex((currentPlayerIndex + 1) % players.length)
            console.log("mobile next turn")
            nextTurn()
        }
    }

    const handleMobilePrevious = () => {
        const currentPlayer = players[currentPlayerIndex]
        const isPaused = gameStarted && !isRunning

        if (isPaused) {
            // Directly set nextPlayerIndex for paused state
            setNextPlayerIndex((currentPlayerIndex - 1 + players.length) % players.length)
            return
        }

        if (currentPlayer?.isActive && gameStarted && isRunning) {
            // Set nextPlayerIndex before calling previousTurn
            setNextPlayerIndex((currentPlayerIndex - 1 + players.length) % players.length)
            previousTurn()
        }
    }

    // Handle player selection in mobile view
    const handleMobilePlayerSelect = (playerId: number) => {
        // If game is paused, allow switching active player
        if (gameStarted && !isRunning) {
            switchToPlayer(playerId)
        } else {
            // Normal behavior for running game
            switchToPlayer(playerId)
        }
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-3 md:p-4">
            <Toaster richColors />
            <div className="max-w-6xl mx-auto">
                {/* Navigation Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button asChild variant="ghost" className="text-amber-700 hover:text-amber-800 hover:bg-amber-100">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                            <Link href="/">
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                            <Link href="/leaderboard">
                                <Trophy className="w-4 h-4 mr-2" />
                                Leaderboard
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Playthrough Form Section */}
                <PlaythroughFormSection />

                <Header
                    currentTurnTime={getCurrentTurnTime()}
                    currentRound={currentRound}
                    activePlayersCount={getActivePlayersCount()}
                />

                <SettingsPanel
                    showSettings={showSettings || !gameStarted}
                    gameStarted={gameStarted}
                    initialTime={initialTime}
                    showAdjustButtons={showAdjustButtons}
                    showColorSelectors={showColorSelectors}
                    soundEnabled={soundEnabled}
                    onInitialTimeChange={setInitialTime}
                    onToggleAdjustButtons={() => setShowAdjustButtons(!showAdjustButtons)}
                    onToggleColorSelectors={() => setShowColorSelectors(!showColorSelectors)}
                    onToggleSound={() => setSoundEnabled(!soundEnabled)}
                />

                <ControlPanel
                    isRunning={isRunning}
                    gameStarted={gameStarted}
                    activePlayer={activePlayer}
                    onStartPause={startPauseTimer}
                    onNextTurn={nextTurn}
                    onStartReveal={startRevealTurn}
                    onEndRound={endRound}
                    onReset={resetGame}
                    onToggleSettings={() => setShowSettings(!showSettings)}
                    roomCode={roomCode}
                />

                {/* Mobile View: Directional Slide Animation */}
                {isMobileView ? (
                    <div className="lg:hidden">
                        <MobileCardNavigation
                            currentIndex={currentPlayerIndex}
                            totalCards={players.length}
                            onPrevious={handleMobilePrevious}
                            onNext={handleMobileNext}
                            isActivePlayer={players[currentPlayerIndex]?.isActive}
                            gameStarted={gameStarted}
                            isRunning={isRunning}
                            isPaused={gameStarted && !isRunning}
                        />

                        <div className="relative h-[520px] overflow-hidden">
                            {/* Mobile Card Container with Directional Slide Animation */}
                            <div className="relative w-full h-full">
                                {players.map((player, index) => {
                                    const offset = index - currentPlayerIndex
                                    const isActive = index === currentPlayerIndex

                                    // Directional slide animation based on navigation
                                    let translateX = offset * 100
                                    if (isTransitioning && slideDirection) {
                                        if (slideDirection === "right") {
                                            translateX -= 100 // Slide left to reveal next card
                                        } else if (slideDirection === "left") {
                                            translateX += 100 // Slide right to reveal previous card
                                        }
                                    }

                                    return (
                                        <div
                                            key={`mobile-card-${player.id}-${currentPlayerIndex}`}
                                            className={`absolute inset-0 transition-transform ${isTransitioning ? "duration-500 ease-out" : "duration-300 ease-in-out"
                                                }`}
                                            style={{
                                                transform: `translateX(${translateX}%)`,
                                                zIndex: isActive ? 20 : 10,
                                                opacity: Math.abs(offset) > 1 ? 0 : 1,
                                            }}
                                        >
                                            <div className="w-full h-full p-2">
                                                <PlayerCard
                                                    player={player}
                                                    isActive={player.isActive}
                                                    currentTurnTime={getCurrentTurnTime()}
                                                    gameStarted={gameStarted}
                                                    initialTime={initialTime}
                                                    showAdjustButtons={showAdjustButtons}
                                                    showColorSelectors={showColorSelectors}
                                                    editingPlayer={editingPlayer}
                                                    editName={editName}
                                                    onPlayerClick={handleMobilePlayerSelect}
                                                    onDragStart={handleDragStart}
                                                    onDragOver={handleDragOver}
                                                    onDrop={handleDrop}
                                                    onAdjustTime={adjustPlayerTime}
                                                    onUpdateName={updatePlayerName}
                                                    onUpdateColor={updatePlayerColor}
                                                    onStartEdit={handleStartEdit}
                                                    onSetEditName={setEditName}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Mobile Card Position Indicators */}
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                {players.map((player, index) => (
                                    <div
                                        key={`mobile-indicator-${index}`}
                                        className={`relative transition-all duration-300 ${index === currentPlayerIndex ? "scale-125" : "hover:scale-110"
                                            }`}
                                    >
                                        <div
                                            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentPlayerIndex
                                                ? "bg-amber-600 shadow-lg ring-2 ring-amber-300"
                                                : player.isActive
                                                    ? "bg-amber-400 shadow-md"
                                                    : "bg-amber-200 hover:bg-amber-300"
                                                }`}
                                        />
                                        {player.isActive && index !== currentPlayerIndex && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Desktop View: Original Animation with Active Card Scaling */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 px-1 md:px-0">
                        {players.map((player) => (
                            <div
                                key={`desktop-card-${player.id}`}
                                className={`transition-all duration-300 ease-out ${player.isActive
                                    ? "transform scale-[1.02] md:scale-105 z-10 shadow-xl"
                                    : "transform scale-100 hover:scale-[1.01] z-0 hover:shadow-md"
                                    }`}
                                style={{
                                    transitionProperty: "transform, box-shadow, border-color",
                                    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                            >
                                <PlayerCard
                                    player={player}
                                    isActive={player.isActive}
                                    currentTurnTime={getCurrentTurnTime()}
                                    gameStarted={gameStarted}
                                    initialTime={initialTime}
                                    showAdjustButtons={showAdjustButtons}
                                    showColorSelectors={showColorSelectors}
                                    editingPlayer={editingPlayer}
                                    editName={editName}
                                    onPlayerClick={switchToPlayer}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onAdjustTime={adjustPlayerTime}
                                    onUpdateName={updatePlayerName}
                                    onUpdateColor={updatePlayerColor}
                                    onStartEdit={handleStartEdit}
                                    onSetEditName={setEditName}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <GameInfo />
            </div>
        </div>
    )
}
