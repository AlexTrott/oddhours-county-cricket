export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  competition_id TEXT NOT NULL,
  group_id TEXT,
  season INTEGER NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  venue TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'live', 'completed', 'abandoned')),
  format TEXT NOT NULL CHECK (format IN ('first-class', 't20', 'lista')),
  day_number INTEGER,
  session TEXT,
  result_text TEXT,
  follow_on INTEGER NOT NULL DEFAULT 0,
  target_runs INTEGER,
  target_balls INTEGER,
  toss_winner_id TEXT,
  toss_decision TEXT,
  updated_at TEXT NOT NULL,
  round TEXT,
  stale INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'seed',
  source_key TEXT,
  last_good_at TEXT
);

CREATE TABLE IF NOT EXISTS innings (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  innings_number INTEGER NOT NULL,
  batting_team_id TEXT NOT NULL,
  runs INTEGER NOT NULL,
  wickets INTEGER NOT NULL,
  overs TEXT NOT NULL,
  declared INTEGER NOT NULL DEFAULT 0,
  byes INTEGER NOT NULL DEFAULT 0,
  leg_byes INTEGER NOT NULL DEFAULT 0,
  wides INTEGER NOT NULL DEFAULT 0,
  no_balls INTEGER NOT NULL DEFAULT 0,
  penalties INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE TABLE IF NOT EXISTS batting (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  innings_id TEXT NOT NULL,
  batting_order INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  runs INTEGER NOT NULL,
  balls INTEGER NOT NULL,
  fours INTEGER NOT NULL DEFAULT 0,
  sixes INTEGER NOT NULL DEFAULT 0,
  dismissal TEXT NOT NULL,
  dismissed_by TEXT,
  fielder TEXT,
  is_striker INTEGER NOT NULL DEFAULT 0,
  is_non_striker INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (innings_id) REFERENCES innings(id)
);

CREATE TABLE IF NOT EXISTS bowling (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  innings_id TEXT NOT NULL,
  bowling_order INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  overs TEXT NOT NULL,
  maidens INTEGER NOT NULL DEFAULT 0,
  runs INTEGER NOT NULL,
  wickets INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (innings_id) REFERENCES innings(id)
);

CREATE TABLE IF NOT EXISTS fall_of_wicket (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  innings_id TEXT NOT NULL,
  wicket_number INTEGER NOT NULL,
  runs INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  overs TEXT NOT NULL,
  FOREIGN KEY (innings_id) REFERENCES innings(id)
);

CREATE TABLE IF NOT EXISTS standings (
  competition_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  team_id TEXT NOT NULL,
  played INTEGER NOT NULL,
  won INTEGER NOT NULL,
  lost INTEGER NOT NULL,
  drawn INTEGER NOT NULL,
  tied INTEGER NOT NULL,
  no_result INTEGER NOT NULL,
  batting_bonus INTEGER NOT NULL DEFAULT 0,
  bowling_bonus INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL,
  deducted INTEGER NOT NULL DEFAULT 0,
  net_run_rate REAL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (competition_id, group_id, season, team_id)
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingest_raw (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  data_type TEXT NOT NULL,
  url TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  status_code INTEGER,
  payload TEXT,
  parse_ok INTEGER NOT NULL,
  error TEXT
);

CREATE TABLE IF NOT EXISTS ingest_failures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  data_type TEXT,
  url TEXT,
  failed_at TEXT NOT NULL,
  error TEXT,
  payload TEXT
);

CREATE INDEX IF NOT EXISTS matches_status_idx ON matches(status, start_at);
CREATE INDEX IF NOT EXISTS matches_teams_idx ON matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS matches_comp_idx ON matches(competition_id, start_at);
CREATE INDEX IF NOT EXISTS innings_match_idx ON innings(match_id, innings_number);
CREATE INDEX IF NOT EXISTS ingest_raw_fetched_idx ON ingest_raw(fetched_at);
`;
