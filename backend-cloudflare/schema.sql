-- D1 Database Schema for Unhoused America Backend

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  city TEXT NOT NULL,
  demographics_json TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  narrative TEXT NOT NULL,
  image_url TEXT NOT NULL
);

-- City chunks table for RAG
CREATE TABLE IF NOT EXISTS city_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding_json TEXT NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personas_city ON personas(city);
CREATE INDEX IF NOT EXISTS idx_personas_created ON personas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_chunks_city ON city_chunks(city);
CREATE INDEX IF NOT EXISTS idx_city_chunks_index ON city_chunks(city, chunk_index);
