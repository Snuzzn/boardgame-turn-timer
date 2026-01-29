"use client"

import { useEffect, useRef, useCallback } from "react"
import { useSocket } from "@/hooks/useSocket"
import type { HostState } from "@/types"
import { useLocalStorage } from "./useLocalStorage"

type HostSnapshotInput = {
    players: Array<{
        id: number
        name: string
        color: string
        isActive: boolean
        isRevealing: boolean
        isOutOfRound: boolean
        timeRemaining: number
    }>
    currentRound: number
    isRunning: boolean
    gameStarted: boolean
}

type UseHostRoomSyncProps = {
    syncSignal: unknown
    snapshotInputs: HostSnapshotInput
    onNextTurn: () => void
    onPauseResume: () => void
    onRevealTurn: () => void
}

const makeRoomCode = () =>
    Math.random().toString(36).slice(2, 8).toUpperCase()

export function useHostRoomSync({
    syncSignal,
    snapshotInputs,
    onNextTurn,
    onPauseResume,
    onRevealTurn,
}: UseHostRoomSyncProps) {
    const { connected, emit, on, off, socket } = useSocket()

    // Get or generate the room code
    const [roomCode, setRoomCode] = useLocalStorage<string | null>("roomCode", null)

    useEffect(() => {
        if (roomCode) return
        if (typeof window === "undefined") return

        // check localStorage directly 
        const existing = window.localStorage.getItem("roomCode")
        if (existing) return

        // only generate if nothing exists anywhere
        setRoomCode(makeRoomCode())
    }, [roomCode, setRoomCode])

    // Prevent double-join on re-renders
    const lastJoinedSocketId = useRef<string | null>(null)

    const buildSnapshot = useCallback((): HostState => {
        const { players, currentRound, isRunning, gameStarted } = snapshotInputs
        return {
            sentAt: Date.now(),
            players: players.map((p) => ({
                id: p.id,
                name: p.name,
                color: p.color,
                isActive: p.isActive,
                isRevealing: p.isRevealing,
                isOutOfRound: p.isOutOfRound,
                timeRemaining: p.timeRemaining,
            })),
            currentRound,
            isRunning,
            gameStarted,
        }
    }, [snapshotInputs])

    // Host joins room (once per socket.id)
    useEffect(() => {
        if (!connected || !socket?.id) return
        if (lastJoinedSocketId.current === socket.id) return

        lastJoinedSocketId.current = socket.id
        emit("room:join", { roomCode, role: "host" })
    }, [connected, socket?.id, emit, roomCode])

    // Emit ONLY when a meaningful game event happened (syncSignal)
    useEffect(() => {
        if (!connected) return
        emit("host:state", { roomCode, snapshot: buildSnapshot() })
    }, [connected, emit, roomCode, syncSignal])

    // Respond to controller late-join / refresh
    useEffect(() => {
        if (!connected) return

        const sendState = () =>
            emit("host:state", { roomCode, snapshot: buildSnapshot() })
        on("host:requestState", sendState)

        return () => off("host:requestState", sendState)
    }, [connected, on, off, emit, roomCode, buildSnapshot])

    // React to controller commands
    useEffect(() => {
        if (!connected) return

        on("game:nextTurn", onNextTurn)
        on("game:pauseResume", onPauseResume)
        on("game:revealTurn", onRevealTurn)

        return () => {
            off("game:nextTurn", onNextTurn)
            off("game:pauseResume", onPauseResume)
            off("game:revealTurn", onRevealTurn)
        }
    }, [connected, on, off, onNextTurn, onPauseResume, onRevealTurn])

    return {
        roomCode,
        connected,
        socketId: socket?.id ?? null,
    }
}
