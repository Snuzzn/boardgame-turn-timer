"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket() {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_WS_SERVER_URL, {
            transports: ["websocket"],
            withCredentials: true
        })
    }
    return socket
}



export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [connected, setConnected] = useState(false)

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

        s.on("connect", onConnect)
        s.on("disconnect", onDisconnect)

        return () => {
            s.off("connect", onConnect)
            s.off("disconnect", onDisconnect)
            // don't disconnect
        }
    }, [])

    const emit = useCallback((event: string, payload?: any) => {
        const s = socketRef.current
        if (s?.connected) s.emit(event, payload)
    }, [])

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.on(event, handler)
    }, [])

    const off = useCallback((event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.off(event, handler)
    }, [])

    return { socket, connected, emit, on, off }
}

