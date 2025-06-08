import { type NextRequest, NextResponse } from "next/server"
import { sql, getUserId } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: { gameId: string; playthroughId: string } }) {
  try {
    const userId = getUserId(request)
    const { gameId, playthroughId } = params

    // Verify user has access to this game
    const [game] = await sql`
      SELECT g.id, g.group_id
      FROM games g
      INNER JOIN group_access ga ON g.group_id = ga.group_id
      WHERE g.id = ${gameId} AND ga.user_id = ${userId}
      LIMIT 1
    `

    if (!game) {
      return NextResponse.json({ success: false, error: "Game not found or access denied" }, { status: 404 })
    }

    // Verify the playthrough exists and belongs to this game
    const [playthrough] = await sql`
      SELECT id FROM playthroughs
      WHERE id = ${playthroughId} AND game_id = ${gameId}
      LIMIT 1
    `

    if (!playthrough) {
      return NextResponse.json({ success: false, error: "Playthrough not found" }, { status: 404 })
    }

    // Delete the playthrough (cascade will handle results)
    await sql`
      DELETE FROM playthroughs
      WHERE id = ${playthroughId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playthrough:", error)
    return NextResponse.json({ success: false, error: "Failed to delete playthrough" }, { status: 500 })
  }
}
