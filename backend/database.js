// backend/db.js
import sqlite3pkg from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const sqlite3 = sqlite3pkg.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'personas.db');
export const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      city TEXT,
      demographics_json TEXT,
      name TEXT,
      age INTEGER,
      narrative TEXT,
      image_url TEXT
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS city_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT,
      chunk_index INTEGER,
      text TEXT,
      embedding_json TEXT
    )
  `);
});

export function createPersona({ city, demographics, name, age, narrative, imageUrl }) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
      INSERT INTO personas (city, demographics_json, name, age, narrative, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            city,
            JSON.stringify(demographics),
            name,
            age,
            narrative,
            imageUrl,
            function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
        stmt.finalize();
    });
}

export function getPersona(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM personas WHERE id = ?`, [id], (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
        });
    });
}

export function listPersonas(limit = 50) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT id, created_at, city, name, age, image_url FROM personas ORDER BY id DESC LIMIT ?`,
            [limit],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            }
        );
    });
}

export function clearCityChunks() {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM city_chunks`, [], function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

export function insertCityChunk({ city, chunkIndex, text, embedding }) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO city_chunks (city, chunk_index, text, embedding_json) VALUES (?, ?, ?, ?)`,
            [city.toLowerCase(), chunkIndex, text, JSON.stringify(embedding)],
            function (err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
    });
}

export function getCityChunks(city) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT chunk_index, text, embedding_json FROM city_chunks WHERE city = ? ORDER BY chunk_index ASC`,
            [city.toLowerCase()],
            (err, rows) => {
                if (err) return reject(err);
                const chunks = rows.map((r) => ({
                    index: r.chunk_index,
                    text: r.text,
                    embedding: JSON.parse(r.embedding_json)
                }));
                resolve(chunks);
            }
        );
    });
}


export function getLastNames(limit = 10) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT name FROM personas
       WHERE name IS NOT NULL AND name != ''
       ORDER BY id DESC
       LIMIT ?`,
            [limit],
            (err, rows) => {
                if (err) return reject(err);
                resolve(rows.map((r) => r.name));
            }
        );
    });
}

export function getLastNamesForCombo(raceEthnicity, genderExpression, limit = 10) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT name, demographics_json
       FROM personas
       WHERE name IS NOT NULL AND name != ''
       ORDER BY id DESC
       LIMIT 100`, // small window to search; adjust if needed
            [],
            (err, rows) => {
                if (err) return reject(err);

                const targetRace = (raceEthnicity || '').toLowerCase().trim();
                const targetGenderExpr = (genderExpression || '').toLowerCase().trim();
                const matches = [];

                for (const row of rows) {
                    let demo = {};
                    try {
                        demo = JSON.parse(row.demographics_json || '{}');
                    } catch (_) { }

                    const race = (demo.raceEthnicity || '').toLowerCase();
                    const genderExpr = (demo.genderExpression || '').toLowerCase();

                    if (race === targetRace && genderExpr === targetGenderExpr) {
                        matches.push(row.name);
                        if (matches.length >= limit) break;
                    }
                }

                resolve(matches);
            }
        );
    });
}