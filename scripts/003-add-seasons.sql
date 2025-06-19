-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'concluded'
    min_games_threshold INTEGER DEFAULT 10,
    total_playthroughs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, season_number)
);

-- Create season badges table
CREATE TABLE IF NOT EXISTS season_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 4),
    badge_type VARCHAR(20) NOT NULL, -- 'champion', 'runner_up', 'bronze', 'fourth'
    total_games INTEGER NOT NULL,
    win_rate DECIMAL(5,2), -- percentage of first place finishes
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(season_id, player_id),
    UNIQUE(season_id, rank)
);

-- Add season_id to playthroughs table
ALTER TABLE playthroughs ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seasons_group_id ON seasons(group_id);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_season_badges_season_id ON season_badges(season_id);
CREATE INDEX IF NOT EXISTS idx_season_badges_player_id ON season_badges(player_id);
CREATE INDEX IF NOT EXISTS idx_playthroughs_season_id ON playthroughs(season_id);

-- Create a function to automatically create the first season for new groups
CREATE OR REPLACE FUNCTION create_initial_season()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO seasons (group_id, season_number, status)
    VALUES (NEW.id, 1, 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create first season when group is created
DROP TRIGGER IF EXISTS trigger_create_initial_season ON groups;
CREATE TRIGGER trigger_create_initial_season
    AFTER INSERT ON groups
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_season();

-- Update existing groups to have a season if they don't already
INSERT INTO seasons (group_id, season_number, status)
SELECT g.id, 1, 'active'
FROM groups g
WHERE NOT EXISTS (
    SELECT 1 FROM seasons s WHERE s.group_id = g.id
);

-- Update existing playthroughs to be associated with the active season
UPDATE playthroughs 
SET season_id = (
    SELECT s.id 
    FROM seasons s 
    WHERE s.group_id = playthroughs.group_id 
    AND s.status = 'active'
    LIMIT 1
)
WHERE season_id IS NULL;
