CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  schema_version TEXT NOT NULL,
  name TEXT NOT NULL,
  goal TEXT,
  data_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  generated_by TEXT,
  generated_at TEXT NOT NULL,
  imported_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_program
  ON programs(is_active) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS session_reports (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  session_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  completion_rate REAL NOT NULL,
  total_volume_kg REAL,
  pr_count INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id)
);
CREATE INDEX IF NOT EXISTS idx_reports_started ON session_reports(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_program ON session_reports(program_id);

CREATE TABLE IF NOT EXISTS active_session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
