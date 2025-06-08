import { type NextRequest, NextResponse } from "next/server"
import { sql, getUserId } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const userId = getUserId(request)
    const { gameId } = params

    console.time("Verify Game Access")
    // Get game and verify access
    const [game] = await sql`
      SELECT g.id, g.group_id
      FROM games g
      INNER JOIN group_access ga ON g.group_id = ga.group_id
      WHERE g.id = ${gameId} AND ga.user_id = ${userId}
      LIMIT 1
    `
    console.timeEnd("Verify Game Access")

    if (!game) {
      return NextResponse.json({ success: false, error: "Game not found or access denied" }, { status: 404 })
    }

    console.time("Fetch Playthroughs")
    // Get all playthroughs for this game with results - optimized query
    const playthroughs = await sql`
      SELECT 
        p.id,
        p.game_id,
        p.group_id,
        p.timestamp,
        p.recorded_by,
        COALESCE(
          json_agg(
            json_build_object(
              'playerId', pr.player_id,
              'playerName', pr.player_name,
              'rank', pr.rank
            ) ORDER BY pr.rank
          ) FILTER (WHERE pr.id IS NOT NULL),
          '[]'::json
        ) as results
      FROM playthroughs p
      LEFT JOIN playthrough_results pr ON p.id = pr.playthrough_id
      WHERE p.game_id = ${gameId}
      GROUP BY p.id, p.game_id, p.group_id, p.timestamp, p.recorded_by
      ORDER BY p.timestamp DESC
    `
    console.timeEnd("Fetch Playthroughs")

    console.log(`Found ${playthroughs.length} playthroughs for game ${gameId}`)

    return NextResponse.json({ success: true, data: playthroughs })
  } catch (error) {
    console.error("Error fetching playthroughs:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch playthroughs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { gameId: string } }) {
  try {
    const userId = getUserId(request)
    const { gameId } = params
    const { results } = await request.json()

    console.time("Create Playthrough")
    console.log("Creating playthrough for game:", gameId, "with results:", results)

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ success: false, error: "Results are required" }, { status: 400 })
    }

    // Get game and verify access
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

    // Validate ranks
    const ranks = results.map((r: any) => r.rank)
    const uniqueRanks = new Set(ranks)
    if (ranks.length !== uniqueRanks.size) {
      return NextResponse.json({ success: false, error: "Each player must have a unique rank" }, { status: 400 })
    }

    const sortedRanks = [...ranks].sort((a, b) => a - b)
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        return NextResponse.json(
          { success: false, error: "Ranks must be consecutive starting from 1st place" },
          { status: 400 },
        )
      }
    }

    // Start transaction - create playthrough
    const [playthrough] = await sql`
      INSERT INTO playthroughs (game_id, group_id, recorded_by)
      VALUES (${gameId}, ${game.group_id}, ${userId})
      RETURNING id, game_id, group_id, timestamp, recorded_by
    `

    console.log("Created playthrough:", playthrough.id)

    // Process each result
    const playthroughResults = []
    for (const result of results) {
      const { playerName, rank } = result

      // Get or create player
      let [player] = await sql`
        SELECT id FROM players
        WHERE group_id = ${game.group_id} AND LOWER(name) = LOWER(${playerName.trim()})
        LIMIT 1
      `

      if (!player) {
        console.log("Creating new player:", playerName.trim())
        ;[player] = await sql`
          INSERT INTO players (name, group_id)
          VALUES (${playerName.trim()}, ${game.group_id})
          RETURNING id
        `
      }

      // Insert playthrough result
      const [playthroughResult] = await sql`
        INSERT INTO playthrough_results (playthrough_id, player_id, player_name, rank)
        VALUES (${playthrough.id}, ${player.id}, ${playerName.trim()}, ${rank})
        RETURNING id, player_id, player_name, rank
      `

      playthroughResults.push({
        playerId: playthroughResult.player_id,
        playerName: playthroughResult.player_name,
        rank: playthroughResult.rank,
      })
    }

    const response = {
      ...playthrough,
      results: playthroughResults,
    }

    console.timeEnd("Create Playthrough")
    console.log("Playthrough created successfully:", response)

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error("Error creating playthrough:", error)
    return NextResponse.json({ success: false, error: "Failed to create playthrough" }, { status: 500 })
  }
}
