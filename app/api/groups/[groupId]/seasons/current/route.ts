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

    // Get current active season
    const [currentSeason] = await sql`
      SELECT * FROM seasons
      WHERE group_id = ${groupId} AND status = 'active'
      ORDER BY season_number DESC
      LIMIT 1
    `

    if (!currentSeason) {
      return NextResponse.json({ success: false, error: "No active season found" }, { status: 404 })
    }

    // Count total playthroughs in current season
    const [playthroughCount] = await sql`
      SELECT COUNT(*) as total
      FROM playthroughs
      WHERE season_id = ${currentSeason.id}
    `

    // Update season with current playthrough count
    await sql`
      UPDATE seasons 
      SET total_playthroughs = ${playthroughCount.total}
      WHERE id = ${currentSeason.id}
    `

    // Get top players for current season
    const topPlayers = await sql`
      SELECT 
        pr.player_id,
        pr.player_name,
        COUNT(*) as total_games,
        COUNT(CASE WHEN pr.rank = 1 THEN 1 END) as first_places,
        ROUND(
          (COUNT(CASE WHEN pr.rank = 1 THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
          2
        ) as win_rate,
        ROUND(AVG(pr.rank::DECIMAL), 2) as average_rank
      FROM playthrough_results pr
      INNER JOIN playthroughs p ON pr.playthrough_id = p.id
      WHERE p.season_id = ${currentSeason.id}
      GROUP BY pr.player_id, pr.player_name
      HAVING COUNT(*) >= 3  -- Minimum 3 games to be eligible
      ORDER BY 
        win_rate DESC,
        total_games DESC,
        average_rank ASC
      LIMIT 10
    `

    const seasonSummary = {
      season: {
        ...currentSeason,
        total_playthroughs: Number.parseInt(playthroughCount.total),
      },
      canConclude: Number.parseInt(playthroughCount.total) >= currentSeason.min_games_threshold,
      topPlayers: topPlayers.map((player) => ({
        playerId: player.player_id,
        playerName: player.player_name,
        totalGames: Number.parseInt(player.total_games),
        firstPlaces: Number.parseInt(player.first_places),
        winRate: Number.parseFloat(player.win_rate),
        averageRank: Number.parseFloat(player.average_rank),
      })),
    }

    return NextResponse.json({ success: true, data: seasonSummary })
  } catch (error) {
    console.error("Error fetching current season:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch current season" }, { status: 500 })
  }
}
