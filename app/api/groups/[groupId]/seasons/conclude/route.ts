import { type NextRequest, NextResponse } from "next/server"
import { sql, getUserId } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
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

    // Check if season can be concluded (has enough games)
    const [playthroughCount] = await sql`
      SELECT COUNT(*) as total
      FROM playthroughs
      WHERE season_id = ${currentSeason.id}
    `

    if (Number.parseInt(playthroughCount.total) < currentSeason.min_games_threshold) {
      return NextResponse.json(
        {
          success: false,
          error: `Season needs at least ${currentSeason.min_games_threshold} games to conclude. Currently has ${playthroughCount.total}.`,
        },
        { status: 400 },
      )
    }

    // Get top 4 players for badge awards
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
      HAVING COUNT(*) >= 3  -- Minimum 3 games to be eligible for badges
      ORDER BY 
        win_rate DESC,
        total_games DESC,
        average_rank ASC
      LIMIT 4
    `

    // Replace the sql.begin transaction block with individual operations
    // Conclude current season
    await sql`
      UPDATE seasons 
      SET 
        status = 'concluded',
        end_date = NOW(),
        total_playthroughs = ${playthroughCount.total}
      WHERE id = ${currentSeason.id}
    `

    // Award badges to top 4 players
    const badgeTypes = ["champion", "runner_up", "bronze", "fourth"]

    for (let i = 0; i < Math.min(topPlayers.length, 4); i++) {
      const player = topPlayers[i]
      await sql`
        INSERT INTO season_badges (
          season_id, 
          player_id, 
          player_name, 
          rank, 
          badge_type, 
          total_games, 
          win_rate
        )
        VALUES (
          ${currentSeason.id},
          ${player.player_id},
          ${player.player_name},
          ${i + 1},
          ${badgeTypes[i]},
          ${player.total_games},
          ${player.win_rate}
        )
      `
    }

    // Create new season
    const [newSeason] = await sql`
      INSERT INTO seasons (group_id, season_number, status, min_games_threshold)
      VALUES (${groupId},
              ${currentSeason.game_id},
        ${currentSeason.season_number + 1}, 
        'active',
        ${currentSeason.min_games_threshold}
      )
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      message: `Season ${currentSeason.season_number} concluded! Season ${currentSeason.season_number + 1} has begun.`,
      data: { seasonNumber: currentSeason.season_number },
    })
  } catch (error) {
    console.error("Error concluding season:", error)
    return NextResponse.json({ success: false, error: "Failed to conclude season" }, { status: 500 })
  }
}
