import { type NextRequest, NextResponse } from "next/server"
import { sql, getUserId } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const userId = getUserId(request)
    const { groupId } = params

    // Verify user has access to this group
    const [access] = await sql`
      SELECT id FROM group_access
      WHERE group_id = ${groupId} AND user_id = ${userId}
      LIMIT 1
    `

    if (!access) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    // Get all seasons for this group with badge counts
    const seasons = await sql`
      SELECT 
        s.*,
        COUNT(sb.id) as badge_count
      FROM seasons s
      LEFT JOIN season_badges sb ON s.id = sb.season_id
      WHERE s.group_id = ${groupId}
      GROUP BY s.id
      ORDER BY s.season_number DESC
    `

    return NextResponse.json({ success: true, data: seasons })
  } catch (error) {
    console.error("Error fetching seasons:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch seasons" }, { status: 500 })
  }
}
