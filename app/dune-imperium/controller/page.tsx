"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { GalleryHorizontalEnd, Pause, Play } from "lucide-react"
import { useSocket } from "@/hooks/useSocket"
import { formatTime } from "@/utils"
import { HostState } from "@/types"
import { useSearchParams } from "next/navigation"
import ConnectingModal from "@/components/ConnectingModal"
import useThrottledEmit from "@/hooks/useThrottledEmit"
import { Spinner } from "@/components/ui/spinner"


export default function Controller() {

    const searchParams = useSearchParams()
    const roomCode = searchParams.get("roomCode")

    const { connected, isConnecting, emit, emitWithAck, on, off, socket } = useSocket()
    const lastJoinedSocketId = useRef<string | null>(null)

    const throttledEmit = useThrottledEmit(emit)

    const [hostState, setHostState] = useState<HostState | null>(null)

    const activePlayer = useMemo(
        () => hostState?.players?.find((p) => p.isActive) ?? null,
        [hostState]
    )

    const isPaused = !!(hostState?.gameStarted && !hostState?.isRunning)
    const isRevealing = !!activePlayer?.isRevealing
    const isOutOfRound = !!activePlayer?.isOutOfRound

    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!hostState?.isRunning) return

        const id = window.setInterval(() => {
            setNow(Date.now())
        }, 250)

        return () => window.clearInterval(id)
    }, [hostState?.isRunning])

    const getDisplayTimeRemaining = (p: HostState["players"][number]) => {
        if (!hostState) return p.timeRemaining
        if (!hostState.isRunning) return p.timeRemaining
        if (!p.isActive) return p.timeRemaining

        const elapsedMs = Math.max(0, now - (hostState.sentAt ?? now))
        const elapsedSeconds = elapsedMs / 1000


        return Math.max(0, Math.ceil(p.timeRemaining - elapsedSeconds))
    }
    const timeRemaining = activePlayer ? getDisplayTimeRemaining(activePlayer) : null


    // Join room + request state
    useEffect(() => {
        if (!connected || !socket?.id || !roomCode) return
        if (lastJoinedSocketId.current === socket.id) return

        lastJoinedSocketId.current = socket.id

        emit("room:join", { roomCode, role: "controller" })
        emit("host:requestState")
    }, [connected, socket?.id, emit, roomCode])

    // Listen for host state
    useEffect(() => {
        if (!connected) return

        const handleState = (payload: any) => {
            // Support either raw snapshot or {roomCode, snapshot}
            const state: HostState = payload?.snapshot ?? payload
            if (!state?.players) return
            setHostState(state)
            setNow(Date.now())
        }

        on("host:state", handleState)
        return () => off("host:state", handleState)
    }, [connected, on, off])

    const [nextTurnPending, setNextTurnPending] = useState(false)

    const handleNextTurn = async () => {
        if (!roomCode || nextTurnPending) return
        try {
            setNextTurnPending(true)
            const res = await emitWithAck<{ ok: boolean; error?: string }>(
                "game:nextTurn",
                { roomCode },
                8000
            )
            if (!res?.ok) throw new Error(res?.error ?? "Next turn failed")
        } finally {
            setNextTurnPending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
            <ConnectingModal open={isConnecting} />
            <div className="w-full py-2 max-w-md rounded-3xl border border-amber-200/70 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-medium uppercase tracking-wide text-amber-700/70">
                                {connected ? "Active Player" : "Connecting…"}
                            </div>
                            <div className="mt-0.5 text-xl font-semibold text-amber-950 truncate">
                                {activePlayer?.name ?? "Waiting for host…"}
                            </div>
                            {timeRemaining != null && (
                                <div
                                    className={`mt-1 text-4xl font-semibold font-mono ${timeRemaining < 60
                                        ? "text-red-600"
                                        : timeRemaining < 180
                                            ? "text-orange-600"
                                            : "text-green-600"
                                        }`}
                                >
                                    {formatTime(timeRemaining)}
                                </div>
                            )}
                        </div>

                        {/* Round pill */}
                        <div className="shrink-0 rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-right shadow-sm">
                            <div className="text-[11px] font-medium text-amber-700/70 leading-none">
                                Round
                            </div>
                            <div className="mt-1 font-mono text-2xl font-semibold tracking-tight text-amber-950 leading-none">
                                {hostState?.currentRound ?? "--"}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="mt-3 flex items-center justify-between">
                        <div
                            className={[
                                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                                isPaused ? "bg-red-100/70 text-red-800" : "bg-amber-100/70 text-amber-800",
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "h-2 w-2 rounded-full",
                                    isPaused ? "bg-red-500" : "bg-green-500 animate-pulse",
                                ].join(" ")}
                            />
                            {hostState ? (isPaused ? "Timer paused" : "Timer running") : "Waiting for host…"}
                        </div>

                        {isRevealing && (
                            <div className="text-xs font-semibold text-purple-700">REVEALING</div>
                        )}
                    </div>

                    {/* Player list */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {(hostState?.players ?? []).map((p) => {
                            const isOut = p.isOutOfRound

                            return (
                                <div
                                    key={p.id}
                                    className={[
                                        "flex items-center justify-between rounded-xl border px-3 py-2 transition",
                                        p.isActive
                                            ? "border-green-300 bg-green-50/60"
                                            : isOut
                                                ? "border-gray-400 bg-gray-100/50 opacity-50"
                                                : "border-amber-200 bg-white/60",
                                    ].join(" ")}
                                >
                                    <div className="min-w-0">
                                        <div
                                            className={[
                                                "font-medium truncate",
                                                isOut ? "text-gray-500" : "text-amber-950",
                                            ].join(" ")}
                                        >
                                            {p.name}
                                        </div>

                                        <div
                                            className={[
                                                "text-xs",
                                                isOut ? "text-gray-500" : "text-amber-700/70",
                                            ].join(" ")}
                                        >
                                            {formatTime(
                                                activePlayer?.name === p.name
                                                    ? timeRemaining ?? 0
                                                    : p.timeRemaining ?? 0
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {p.isActive && (
                                            <span className="text-xs font-semibold text-green-700">
                                                ACTIVE
                                            </span>
                                        )}
                                        {hostState?.gameStarted && !p.isActive && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0 text-gray-500 hover:text-purple-600 hover:bg-purple-100"
                                                title={p.isOutOfRound ? "Undo revealed" : "Mark as revealed"}
                                                onClick={() =>
                                                    throttledEmit(
                                                        "game:markPlayerRevealed",
                                                        { roomCode, playerId: p.id },
                                                        400
                                                    )
                                                }
                                            >
                                                <GalleryHorizontalEnd className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>


                    {/* Actions */}

                    {hostState?.gameStarted &&
                        <div className="mt-5 grid grid-cols-1 gap-4">
                            {activePlayer && <>

                                <Button
                                    className={[
                                        "h-12 text-sm rounded-xl active:scale-[0.98] transition flex items-center justify-center",
                                        isRevealing
                                            ? "bg-purple-500 hover:bg-purple-600 text-white"
                                            : "bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-600/10",
                                    ].join(" ")}
                                    onClick={() =>
                                        throttledEmit("game:revealTurn", { roomCode }, 800)
                                    }
                                >
                                    {isRevealing ? "Revealing..." : "Start reveal"}
                                </Button>

                                <Button
                                    onClick={() =>
                                        throttledEmit("game:pauseResume", { roomCode }, 500)
                                    }
                                    className={[
                                        "h-12 text-sm rounded-xl active:scale-[0.98] transition flex items-center justify-center",
                                        isPaused
                                            ? "bg-[#D47512] hover:bg-[#c86810] text-white"
                                            : "bg-transparent border-2 border-[#D47512] text-[#D47512] hover:bg-[#D47512]/10",
                                    ].join(" ")}
                                >
                                    {isPaused ? (
                                        <>
                                            <Play className="w-5 h-5 mr-2" />
                                            Resume timer
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="w-5 h-5 mr-2" />
                                            Pause timer
                                        </>
                                    )}
                                </Button>
                            </>
                            }
                            <Button
                                className="h-12 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-[0.99] transition"
                                disabled={!connected || nextTurnPending} onClick={handleNextTurn}
                            >
                                {nextTurnPending ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Spinner size="sm" className="border-red-400 border-t-white" />
                                    </span>
                                ) : (
                                    "Next turn"
                                )}
                            </Button>
                        </div>}
                </div>
            </div>
        </div>
    )
}
