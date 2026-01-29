"use client"

import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QRCodeCanvas } from "qrcode.react"

interface ControlPanelProps {
    isRunning: boolean
    gameStarted: boolean
    activePlayer: any
    roomCode: string | null
    onStartPause: () => void
    onNextTurn: () => void
    onStartReveal: () => void
    onEndRound: () => void
    onReset: () => void
    onToggleSettings: () => void
}

export const ControlPanel = ({
    isRunning,
    gameStarted,
    activePlayer,
    roomCode,
    onStartPause,
    onNextTurn,
    onStartReveal,
    onEndRound,
    onReset,
    onToggleSettings,
}: ControlPanelProps) => {
    return (
        <Card className="mb-8 border-2 border-amber-200 bg-gradient-to-r from-amber-100 to-orange-100">
            <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Button onClick={onStartPause} size="lg" className="bg-amber-600 hover:bg-amber-700 text-white px-8">
                        {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                        {isRunning ? "Pause" : gameStarted ? "Resume" : "Start Game"}
                    </Button>

                    <Button
                        onClick={onNextTurn}
                        disabled={!gameStarted}
                        size="lg"
                        variant="outline"
                        className="border-amber-600 text-amber-700 hover:bg-amber-50 px-8"
                    >
                        Next Turn
                    </Button>

                    {activePlayer && !activePlayer.isRevealing && (
                        <Button
                            onClick={onStartReveal}
                            disabled={!gameStarted}
                            size="lg"
                            variant="outline"
                            className="border-purple-600 text-purple-700 hover:bg-purple-50 px-6"
                        >
                            Start Reveal
                        </Button>
                    )}

                    <Button
                        onClick={onEndRound}
                        disabled={!gameStarted}
                        size="lg"
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50 px-6"
                    >
                        End Round
                    </Button>

                    <Button onClick={onReset} size="lg" variant="outline" className="border-red-400 text-red-600 hover:bg-red-50">
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Reset
                    </Button>

                    {gameStarted && (
                        <Button
                            onClick={onToggleSettings}
                            size="lg"
                            variant="outline"
                            className="border-blue-400 text-blue-600 hover:bg-blue-50"
                        >
                            <Settings className="w-5 h-5 mr-2" />
                            Settings
                        </Button>
                    )}
                    <QRCodeCanvas
                        value={`${process.env.NEXT_PUBLIC_APP_URL}/dune-imperium/controller/${roomCode}`}
                        size={40}
                        bgColor="transparent"
                        fgColor="#74531d"
                        level="M"
                    />
                </div>
                <div className="text-center mt-4 text-sm text-amber-700">
                    <p>
                        <strong>Shortcuts:</strong> Space = Pause/Resume, → = Next Turn, ← = Previous Turn
                    </p>
                </div>

            </CardContent>
        </Card>
    )
}
