-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_playthroughs_timestamp ON playthroughs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_playthrough_results_rank ON playthrough_results(rank);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_group_access_user_group ON group_access(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_games_group_created ON games(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_group_name ON players(group_id, name);
CREATE INDEX IF NOT EXISTS idx_playthroughs_game_timestamp ON playthroughs(game_id, timestamp DESC);

-- Analyze tables for better query planning
ANALYZE groups;
ANALYZE group_access;
ANALYZE games;
ANALYZE players;
ANALYZE playthroughs;
ANALYZE playthrough_results;
