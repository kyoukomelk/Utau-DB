import Database from 'better-sqlite3';
import path from 'path';

// Connect to SQLite DB in a data folder
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'cds.db');

// Ensure directory exists if not running in docker (docker will mount it)
import fs from 'fs';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS cds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mbid TEXT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    year TEXT,
    tracklist TEXT, -- JSON string
    album_art_url TEXT,
    status TEXT DEFAULT 'wanna_buy', -- 'wanna_buy' or 'have'
    catalog_number TEXT,
    format TEXT DEFAULT 'CD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration to add format column safely if table already exists
try {
  db.exec(`ALTER TABLE cds ADD COLUMN format TEXT DEFAULT 'CD'`);
} catch (e) {
  // Column already exists, ignore
}

// Settings table for authentication
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT,
    session_token TEXT
  )
`);

// Insert default row if not exists
db.exec(`INSERT OR IGNORE INTO settings (id) VALUES (1)`);

export default db;
