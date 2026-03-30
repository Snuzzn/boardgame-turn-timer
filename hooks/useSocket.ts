"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket() {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_WS_SERVER_URL, {
            transports: ["websocket"],
            withCredentials: true,
            // Make resume-from-sleep feel snappy by reducing Socket.IO's
            // reconnect backoff (default can be up to ~5s).
            reconnection: true,
            reconnectionDelay: 250,
            reconnectionDelayMax: 1000,
            randomizationFactor: 0
        })
    }
    return socket
}



export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [connected, setConnected] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

    // always points to the latest socket instance
    const socketRef = useRef<Socket | null>(null)

    useEffect(() => {
        const s = getSocket()
        socketRef.current = s
        setSocket(s)

        const onConnect = () => setConnected(true)
        const onDisconnect = () => setConnected(false)

        // initialise connected state (in case socket is already connected)
        setConnected(s.connected)
        setIsConnecting(!s.connected)

        const onReconnectAttempt = () => setIsConnecting(true)
        const onReconnectFailed = () => setIsConnecting(false)

        s.on("connect", onConnect)
        s.on("disconnect", onDisconnect)

        // Reconnecting events live on the underlying Manager.
        // This lets us show the "Connecting..." modal only when a
        // reconnect attempt actually starts (not immediately on disconnect).
        s.io.on("reconnect_attempt", onReconnectAttempt)
        s.io.on("reconnect_failed", onReconnectFailed)

        return () => {
            s.off("connect", onConnect)
            s.off("disconnect", onDisconnect)
            s.io.off("reconnect_attempt", onReconnectAttempt)
            s.io.off("reconnect_failed", onReconnectFailed)
            // don't disconnect
        }
    }, [])

    const emit = useCallback((event: string, payload?: any) => {
        const s = socketRef.current
        if (s?.connected) s.emit(event, payload)
    }, [])

    const emitWithAck = useCallback(
        <TResponse = any>(event: string, payload?: any, timeoutMs = 8000) => {
            const s = socketRef.current
            return new Promise<TResponse>((resolve, reject) => {
                if (!s) return reject(new Error("Socket not initialised"))
                if (!s.connected) return reject(new Error("Socket not connected"))

                s.timeout(timeoutMs).emit(event, payload, (err: any, response: TResponse) => {
                    if (err) reject(err)
                    else resolve(response)
                })
            })
        },
        []
    )

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.on(event, handler)
    }, [])

    const off = useCallback((event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.off(event, handler)
    }, [])

    return { socket, connected, isConnecting, emit, emitWithAck, on, off }
}

