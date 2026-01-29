"use client"

import { useState, useEffect, useRef } from "react"
import type { Player } from "@/types"
import { DEFAULT_INITIAL_TIME } from "@/constants"
import { useSoundEffects } from "./useSoundEffects"
import { track } from "@vercel/analytics/react"

const initialPlayers: Player[] = [
    {
        id: 1,
        name: "Player 1",
        timeRemaining: DEFAULT_INITIAL_TIME,
        totalEfficiency: 0,
        currentTurnEfficiency: 0,
        turnsCompleted: 0,
        isActive: true,
        color: "blue",
        isRevealing: false,
        isOutOfRound: false,
    },
    {
        id: 2,
        name: "Player 2",
        timeRemaining: DEFAULT_INITIAL_TIME,
        totalEfficiency: 0,
        currentTurnEfficiency: 0,
        turnsCompleted: 0,
        isActive: false,
        color: "green",
        isRevealing: false,
        isOutOfRound: false,
    },
    {
        id: 3,
        name: "Player 3",
        timeRemaining: DEFAULT_INITIAL_TIME,
        totalEfficiency: 0,
        currentTurnEfficiency: 0,
        turnsCompleted: 0,
        isActive: false,
        color: "purple",
        isRevealing: false,
        isOutOfRound: false,
    },
    {
        id: 4,
        name: "Player 4",
        timeRemaining: DEFAULT_INITIAL_TIME,
        totalEfficiency: 0,
        currentTurnEfficiency: 0,
        turnsCompleted: 0,
        isActive: false,
        color: "orange",
        isRevealing: false,
        isOutOfRound: false,
    },
]

export const useGameTimer = () => {
    // Hydration flag
    const [hydrated, setHydrated] = useState(false)
    useEffect(() => {
        setHydrated(true)
    }, [])

    // SSR-safe initial state
    const [players, setPlayers] = useState<Player[]>(initialPlayers)
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [turnStartTime, setTurnStartTime] = useState<number | null>(null)
    const [pausedElapsedTime, setPausedElapsedTime] = useState<number>(0)
    const [gameStarted, setGameStarted] = useState<boolean>(false)
    const [gameStartTime, setGameStartTime] = useState<number | null>(null)
    const [currentRound, setCurrentRound] = useState<number>(1)
    const [initialTime, setInitialTime] = useState<number>(DEFAULT_INITIAL_TIME)
    const [showSettings, setShowSettings] = useState(false)
    const [showAdjustButtons, setShowAdjustButtons] = useState<boolean>(false)
    const [showColorSelectors, setShowColorSelectors] = useState(true)
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
    const [editingPlayer, setEditingPlayer] = useState<number | null>(null)
    const [editName, setEditName] = useState("")
    const [draggedPlayer, setDraggedPlayer] = useState<number | null>(null)
    const [lastOvertimeWarning, setLastOvertimeWarning] = useState<number>(0)
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0)
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
    const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null)
    const [manualNavigation, setManualNavigation] = useState<boolean>(false)
    const [nextPlayerId, setNextPlayerId] = useState<number | null>(null)
    const [playerOrder, setPlayerOrder] = useState<number[]>([])
    const [currentOrderIndex, setCurrentOrderIndex] = useState<number>(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const manualNavigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const sounds = useSoundEffects(soundEnabled)

    const activePlayer = players.find((p) => p.isActive)
    const activePlayerIndex = players.findIndex((p) => p.isActive)

    const [syncSignal, setSyncSignal] = useState(0)
    const triggerSync = () => {
        queueMicrotask(() => {
            setSyncSignal((v) => v + 1)
        })
    }

    // Track page visit on mount
    useEffect(() => {
        track("page_visited", { page: "timer" })
    }, [])

    // Load from localStorage on mount
    useEffect(() => {
        if (!hydrated) return
        const get = (key: string) => {
            if (typeof window === "undefined") return null
            return localStorage.getItem(key)
        }
        const storedPlayers = get("dune-timer-players")
        if (storedPlayers) setPlayers(JSON.parse(storedPlayers))
        const storedRunning = get("dune-timer-running")
        if (storedRunning) setIsRunning(JSON.parse(storedRunning))
        const storedStarted = get("dune-timer-started")
        if (storedStarted) setGameStarted(JSON.parse(storedStarted))
        const storedGameStart = get("dune-timer-game-start")
        if (storedGameStart) setGameStartTime(JSON.parse(storedGameStart))
        const storedRound = get("dune-timer-round")
        if (storedRound) setCurrentRound(JSON.parse(storedRound))
        const storedInitial = get("dune-timer-initial")
        if (storedInitial) setInitialTime(JSON.parse(storedInitial))
        const storedAdjust = get("dune-timer-adjust-buttons")
        if (storedAdjust) setShowAdjustButtons(JSON.parse(storedAdjust))
        const storedSound = get("dune-timer-sound")
        if (storedSound) setSoundEnabled(JSON.parse(storedSound))
    }, [hydrated])

    // Persist to localStorage on change
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem("dune-timer-players", JSON.stringify(players))
    }, [players, hydrated])
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem("dune-timer-running", JSON.stringify(isRunning))
    }, [isRunning, hydrated])
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem("dune-timer-started", JSON.stringify(gameStarted))
    }, [gameStarted, hydrated])
    useEffect(() => {
        if (!hydrated) return
        if (gameStartTime) localStorage.setItem("dune-timer-game-start", JSON.stringify(gameStartTime))
    }, [gameStartTime, hydrated])
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem("dune-timer-round", JSON.stringify(currentRound))
    }, [currentRound, hydrated])
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem("dune-timer-initial", JSON.stringify(initialTime))
    }, [initialTime, hydrated])
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem("dune-timer-adjust-buttons", JSON.stringify(showAdjustButtons))
    }, [showAdjustButtons, hydrated])
    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem("dune-timer-sound", JSON.stringify(soundEnabled))
    }, [soundEnabled, hydrated])

    // Auto-track active player ONLY when game is running and no manual navigation
    useEffect(() => {
        const isPaused = gameStarted && !isRunning

        if (isPaused || manualNavigation || activePlayerIndex === currentPlayerIndex || isTransitioning) {
            return
        }

        if (activePlayerIndex !== -1 && activePlayerIndex !== currentPlayerIndex && isRunning && gameStarted) {
            console.log("Auto-tracking to active player:", activePlayerIndex)
            setIsTransitioning(true)
            setSlideDirection("right")
            setTimeout(() => {
                setCurrentPlayerIndex(activePlayerIndex)
                setTimeout(() => {
                    setIsTransitioning(false)
                    setSlideDirection(null)
                }, 500)
            }, 50)
        }
    }, [activePlayerIndex, gameStarted, isRunning, manualNavigation, isTransitioning])

    // Timer effect with proper pause functionality
    useEffect(() => {
        if (isRunning && activePlayer && turnStartTime) {
            intervalRef.current = setInterval(() => {
                setPlayers((prev) =>
                    prev.map((player) => {
                        if (player.isActive) {
                            const currentTurnTime = Math.floor((Date.now() - turnStartTime) / 1000) + pausedElapsedTime
                            const currentEfficiency = 60 - currentTurnTime

                            if (currentTurnTime > 60 && Math.floor(currentTurnTime / 30) > lastOvertimeWarning) {
                                sounds.playOvertime()
                                setLastOvertimeWarning(Math.floor(currentTurnTime / 30))
                            }

                            return {
                                ...player,
                                timeRemaining: Math.max(0, player.timeRemaining - 1),
                                currentTurnEfficiency: currentEfficiency,
                            }
                        }
                        return player
                    }),
                )
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning, activePlayer, turnStartTime, pausedElapsedTime, sounds, lastOvertimeWarning, setPlayers])

    // Auto-save game state
    useEffect(() => {
        if (gameStarted && turnStartTime && typeof window !== "undefined") {
            localStorage.setItem("dune-timer-turn-start", turnStartTime.toString())
            localStorage.setItem("dune-timer-paused-elapsed", pausedElapsedTime.toString())
        }
    }, [gameStarted, turnStartTime, pausedElapsedTime])

    // Restore turn start time and paused elapsed time
    useEffect(() => {
        if (gameStarted && !turnStartTime && typeof window !== "undefined") {
            const savedTurnStart = localStorage.getItem("dune-timer-turn-start")
            const savedPausedElapsed = localStorage.getItem("dune-timer-paused-elapsed")
            if (savedTurnStart) {
                setTurnStartTime(Number.parseInt(savedTurnStart))
            }
            if (savedPausedElapsed) {
                setPausedElapsedTime(Number.parseInt(savedPausedElapsed))
            }
        }
    }, [gameStarted, turnStartTime])

    const getCurrentTurnTime = (): number => {
        if (!turnStartTime) return 0
        if (!isRunning) return pausedElapsedTime
        return Math.floor((Date.now() - turnStartTime) / 1000) + pausedElapsedTime
    }

    const getActivePlayersCount = (): number => {
        return players.filter((p) => !p.isOutOfRound).length
    }

    const startPauseTimer = () => {
        if (!gameStarted) {
            // Store initial player order when game starts
            setPlayerOrder(players.map((p) => p.id))
            setCurrentOrderIndex(0)
            setGameStarted(true)
            setGameStartTime(Date.now())
            setTurnStartTime(Date.now())
            setPausedElapsedTime(0)
            setShowSettings(false)
            setShowColorSelectors(false)
            sounds.playGameStart()

            // Track game start
            track("game_started", { player_count: players.length, initial_time_minutes: initialTime / 60 })

            setPlayers((prev) =>
                prev.map((player) =>
                    player.isActive
                        ? {
                            ...player,
                            timeRemaining: player.timeRemaining + 60,
                            currentTurnEfficiency: 0,
                        }
                        : player,
                ),
            )
            setIsRunning(true)
        } else if (isRunning) {
            // Pause the game
            if (turnStartTime) {
                const currentElapsed = Math.floor((Date.now() - turnStartTime) / 1000) + pausedElapsedTime
                setPausedElapsedTime(currentElapsed)
            }
            setIsRunning(false)
        } else {
            // Resume the game - don't add extra time
            setTurnStartTime(Date.now())
            setIsRunning(true)
        }

        triggerSync()
    }

    const switchToPlayer = (playerId: number) => {
        if (!gameStarted) return
        if (!isRunning) {
            // When game is paused, just switch the active player without time changes
            setPlayers((prev) =>
                prev.map((player) => {
                    if (player.isActive) {
                        return { ...player, isActive: false }
                    } else if (player.id === playerId && !player.isOutOfRound) {
                        return {
                            ...player,
                            isActive: true,
                            currentTurnEfficiency: 0,
                            isRevealing: false,
                        }
                    }
                    return player
                }),
            )

            triggerSync()

            return
        }

        // When game is running, switch players with full turn logic
        const currentTime = Date.now()
        const turnDuration = turnStartTime ? Math.floor((currentTime - turnStartTime) / 1000) + pausedElapsedTime : 0
        const turnEfficiency = 60 - turnDuration

        sounds.playTurnChange()
        setLastOvertimeWarning(0)

        // Track turn completion
        track("turn_completed", { duration_seconds: turnDuration, is_overtime: turnDuration > 60 })

        setPlayers((prev) =>
            prev.map((player) => {
                if (player.isActive) {
                    return {
                        ...player,
                        isActive: false,
                        totalEfficiency: player.totalEfficiency + turnEfficiency,
                        turnsCompleted: player.turnsCompleted + 1,
                    }
                } else if (player.id === playerId && !player.isOutOfRound) {
                    return {
                        ...player,
                        isActive: true,
                        timeRemaining: player.timeRemaining + 60,
                        currentTurnEfficiency: 0,
                        isRevealing: false,
                    }
                }
                return player
            }),
        )

        setTurnStartTime(currentTime)
        setPausedElapsedTime(0)

        triggerSync()
    }

    const nextTurn = () => {
        if (!gameStarted) return

        const availablePlayers = players.filter((p) => !p.isOutOfRound)

        if (availablePlayers.length === 0) {
            console.log("end round")
            endRound()
            return
        }
        const currentTime = Date.now()
        const turnDuration = turnStartTime ? Math.floor((currentTime - turnStartTime) / 1000) + pausedElapsedTime : 0
        const turnEfficiency = 60 - turnDuration

        sounds.playTurnChange()
        setLastOvertimeWarning(0)

        // Track turn completion
        track("turn_completed", { duration_seconds: turnDuration, is_overtime: turnDuration > 60 })

        setPlayers((prev) => {
            const updatedPlayers = prev.map((player) => {
                if (player.isActive) {
                    const newPlayer = {
                        ...player,
                        isActive: false,
                        totalEfficiency: player.totalEfficiency + turnEfficiency,
                        turnsCompleted: player.turnsCompleted + 1,
                    }

                    if (player.isRevealing) {
                        newPlayer.isOutOfRound = true
                        newPlayer.isRevealing = false
                    }

                    return newPlayer
                }
                return player
            })

            const availablePlayers = updatedPlayers.filter((p) => !p.isOutOfRound)

            if (availablePlayers.length > 0) {
                const currentActivePlayer = prev.find((p) => p.isActive)
                if (currentActivePlayer) {
                    const currentPlayerIndex = prev.findIndex((p) => p.id === currentActivePlayer.id)

                    let nextPlayerIndex = (currentPlayerIndex + 1) % prev.length
                    let nextPlayer = prev[nextPlayerIndex]

                    while (nextPlayer.isOutOfRound && nextPlayerIndex !== currentPlayerIndex) {
                        nextPlayerIndex = (nextPlayerIndex + 1) % prev.length
                        nextPlayer = prev[nextPlayerIndex]
                    }

                    if (!nextPlayer.isOutOfRound) {
                        return updatedPlayers.map((player) => {
                            if (player.id === nextPlayer.id) {
                                return {
                                    ...player,
                                    isActive: true,
                                    timeRemaining: player.timeRemaining + 60,
                                    currentTurnEfficiency: 0,
                                    isRevealing: false,
                                }
                            }
                            return player
                        })
                    }
                }
            }

            return updatedPlayers
        })

        setTurnStartTime(currentTime)
        setPausedElapsedTime(0)
        setIsRunning(true)


        triggerSync()
    }
    const previousTurn = () => {
        if (!gameStarted) return

        const availablePlayers = players.filter((p) => !p.isOutOfRound)
        if (availablePlayers.length === 0) return

        const currentActivePlayer = players.find((p) => p.isActive)
        if (!currentActivePlayer) return

        const currentPlayerIndex = players.findIndex((p) => p.id === currentActivePlayer.id)

        let prevPlayerIndex = currentPlayerIndex === 0 ? players.length - 1 : currentPlayerIndex - 1
        let prevPlayer = players[prevPlayerIndex]

        while (prevPlayer.isOutOfRound && prevPlayerIndex !== currentPlayerIndex) {
            prevPlayerIndex = prevPlayerIndex === 0 ? players.length - 1 : prevPlayerIndex - 1
            prevPlayer = players[prevPlayerIndex]
        }

        if (prevPlayer.isOutOfRound) return

        sounds.playTurnChange()
        setLastOvertimeWarning(0)

        setPlayers((prev) =>
            prev.map((player) => {
                if (player.isActive) {
                    return { ...player, isActive: false }
                } else if (player.id === prevPlayer.id) {
                    return {
                        ...player,
                        isActive: true,
                        timeRemaining: player.timeRemaining + 60,
                        currentTurnEfficiency: 0,
                        isRevealing: false,
                    }
                }
                return player
            }),
        )

        setTurnStartTime(Date.now())
        setPausedElapsedTime(0)
        setIsRunning(true)

        triggerSync()
    }

    const startRevealTurn = () => {
        if (!activePlayer) return

        sounds.playReveal()

        setPlayers((prev) =>
            prev.map((player) =>
                player.isActive
                    ? {
                        ...player,
                        isRevealing: true,
                    }
                    : player,
            ),
        )

        triggerSync()
    }

    const endRound = () => {
        sounds.playRoundEnd()

        // Track round completion
        track("round_completed", { round_number: currentRound, active_players: getActivePlayersCount() })

        // Calculate the next player index before incrementing
        const nextIndex = (currentOrderIndex + 1) % playerOrder.length
        const nextPlayerId = playerOrder[nextIndex]

        // Update the order index
        setCurrentOrderIndex(nextIndex)

        // Reset ALL players and start with the next player in order
        setPlayers((prev) =>
            prev.map((player) => ({
                ...player,
                isOutOfRound: false,
                isRevealing: false,
                isActive: player.id === nextPlayerId,
                turnsCompleted: 0,
                currentTurnEfficiency: 0,
                timeRemaining: player.id === nextPlayerId ? player.timeRemaining + 60 : player.timeRemaining,
            })),
        )

        setCurrentRound((prev) => prev + 1)
        setTurnStartTime(Date.now())
        setPausedElapsedTime(0)
        setIsRunning(true)
        setLastOvertimeWarning(0)
        setManualNavigation(false)

        triggerSync()
    }

    const resetGame = () => {
        // Track game completion if it was started
        if (gameStarted && gameStartTime) {
            const gameDuration = (Date.now() - gameStartTime) / 1000
            track("game_completed", {
                duration_minutes: Math.round(gameDuration / 60),
                player_count: players.length,
                total_rounds: currentRound,
            })
        } else {
            track("game_reset", { reason: "manual" })
        }

        setPlayers((prev) =>
            prev.map((player, index) => ({
                ...player,
                timeRemaining: initialTime,
                totalEfficiency: 0,
                currentTurnEfficiency: 0,
                turnsCompleted: 0,
                isActive: index === 0,
                isRevealing: false,
                isOutOfRound: false,
            })),
        )
        setIsRunning(false)
        setGameStarted(false)
        setGameStartTime(null)
        setTurnStartTime(null)
        setPausedElapsedTime(0)
        setCurrentRound(1)
        setShowSettings(true)
        setShowColorSelectors(true)
        setLastOvertimeWarning(0)
        setCurrentPlayerIndex(0)
        setIsTransitioning(false)
        setSlideDirection(null)
        setManualNavigation(false)
        setNextPlayerId(null)
        setPlayerOrder([])
        setCurrentOrderIndex(0)
        if (typeof window !== "undefined") {
            localStorage.removeItem("dune-timer-turn-start")
            localStorage.removeItem("dune-timer-paused-elapsed")
            localStorage.removeItem("dune-timer-game-start")
        }

        triggerSync()
    }

    const adjustPlayerTime = (playerId: number, adjustment: number) => {
        setPlayers((prev) =>
            prev.map((player) =>
                player.id === playerId ? { ...player, timeRemaining: Math.max(0, player.timeRemaining + adjustment) } : player,
            ),
        )

        triggerSync()
    }

    const updatePlayerName = (playerId: number, newName: string) => {
        setPlayers((prev) => prev.map((player) => (player.id === playerId ? { ...player, name: newName } : player)))
        setEditingPlayer(null)
        setEditName("")

        triggerSync()
    }

    const updatePlayerColor = (playerId: number, newColor: string) => {
        setPlayers((prev) => prev.map((player) => (player.id === playerId ? { ...player, color: newColor } : player)))
        triggerSync()
    }

    const handleDragStart = (playerId: number) => {
        setDraggedPlayer(playerId)
    }

    const handleDrop = (targetPlayerId: number) => {
        if (draggedPlayer === null || draggedPlayer === targetPlayerId) return

        setPlayers((prev) => {
            const newPlayers = [...prev]
            const draggedIndex = newPlayers.findIndex((p) => p.id === draggedPlayer)
            const targetIndex = newPlayers.findIndex((p) => p.id === targetPlayerId)

            const [draggedItem] = newPlayers.splice(draggedIndex, 1)
            newPlayers.splice(targetIndex, 0, draggedItem)

            return newPlayers
        })
        setDraggedPlayer(null)
        triggerSync()
    }

    const nextPlayerCard = (direction: "left" | "right" = "right") => {
        setManualNavigation(true)

        if (manualNavigationTimeoutRef.current) {
            clearTimeout(manualNavigationTimeoutRef.current)
        }

        // Track mobile navigation
        track("mobile_navigation", { direction, context: gameStarted && !isRunning ? "paused" : "active" })

        console.log("Manual next navigation triggered")

        setIsTransitioning(true)
        setSlideDirection(direction)
        setCurrentPlayerIndex((prev) => {
            const newIndex = prev === 0 ? players.length - 1 : prev - 1
            console.log("Setting currentPlayerIndex to:", newIndex)
            return newIndex
        })
        setTimeout(() => {
            setIsTransitioning(false)
            setSlideDirection(null)
        }, 500)

        manualNavigationTimeoutRef.current = setTimeout(() => {
            console.log("Resetting manual navigation flag")
            setManualNavigation(false)
        }, 2000)
    }

    const previousPlayerCard = (direction: "left" | "right" = "left") => {
        setManualNavigation(true)

        if (manualNavigationTimeoutRef.current) {
            clearTimeout(manualNavigationTimeoutRef.current)
        }

        // Track mobile navigation
        track("mobile_navigation", { direction, context: gameStarted && !isRunning ? "paused" : "active" })

        console.log("Manual previous navigation triggered")

        setIsTransitioning(true)
        setSlideDirection(direction)

        setTimeout(() => {
            setCurrentPlayerIndex((prev) => {
                const newIndex = prev === 0 ? players.length - 1 : prev - 1
                console.log("Setting currentPlayerIndex to:", newIndex)
                return newIndex
            })

            setTimeout(() => {
                setIsTransitioning(false)
                setSlideDirection(null)
            }, 500)
        }, 50)

        manualNavigationTimeoutRef.current = setTimeout(() => {
            console.log("Resetting manual navigation flag")
            setManualNavigation(false)
        }, 2000)
    }

    // Track settings changes
    const setInitialTimeWithAnalytics = (time: number) => {
        track("settings_changed", { setting: "initial_time", value: String(time / 60) })
        setInitialTime(time)
    }

    const setShowAdjustButtonsWithAnalytics = (show: boolean) => {
        track("settings_changed", { setting: "show_adjust_buttons", value: String(show) })
        setShowAdjustButtons(show)
    }

    const setSoundEnabledWithAnalytics = (enabled: boolean) => {
        track("settings_changed", { setting: "sound_enabled", value: String(enabled) })
        setSoundEnabled(enabled)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (manualNavigationTimeoutRef.current) {
                clearTimeout(manualNavigationTimeoutRef.current)
            }
        }
    }, [])

    return {
        hydrated,
        players,
        isRunning,
        turnStartTime,
        gameStarted,
        currentRound,
        initialTime,
        showSettings,
        showAdjustButtons,
        showColorSelectors,
        soundEnabled,
        editingPlayer,
        editName,
        draggedPlayer,
        activePlayer,
        activePlayerIndex,
        currentPlayerIndex,
        isTransitioning,
        slideDirection,
        nextPlayerId,
        getCurrentTurnTime,
        getActivePlayersCount,
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
        setInitialTime: setInitialTimeWithAnalytics,
        setShowSettings,
        setShowAdjustButtons: setShowAdjustButtonsWithAnalytics,
        setShowColorSelectors,
        setSoundEnabled: setSoundEnabledWithAnalytics,
        setEditingPlayer,
        setEditName,
        setCurrentPlayerIndex,
        setManualNavigation,
        syncSignal,
    }
}
