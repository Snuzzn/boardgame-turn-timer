import { type NextRequest, NextResponse } from "next/server"
import { sql, getUserId } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { groupId: string; seasonId: string } }) {
  try {
    const userId = getUserId(request)
    const { groupId, seasonId } = params

    // Verify user has access to this group
    const [access] = await sql`
      SELECT id FROM group_access
      WHERE group_id = ${groupId} AND user_id = ${userId}
      LIMIT 1
    `

    if (!access) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    // Get badges for the season
    const badges = await sql`
      SELECT sb.*, s.season_number
      FROM season_badges sb
      INNER JOIN seasons s ON sb.season_id = s.id
      WHERE sb.season_id = ${seasonId}
      ORDER BY sb.rank ASC
    `

    return NextResponse.json({ success: true, data: badges })
  } catch (error) {
    console.error("Error fetching season badges:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch season badges" }, { status: 500 })
  }
}
