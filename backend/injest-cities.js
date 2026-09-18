// backend/ingest-cities.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { embedText } from './gemini.js';
import { clearCityChunks, insertCityChunk } from './database.js';

// Node ESM __dirname helper
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function splitIntoChunks(text, maxChars = 1200, overlap = 200) {
    // Normalize whitespace
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return [];

    // Split into "sentences" on ., !, ?, or line breaks
    const rawSentences = clean.split(/(?<=[\.!?])\s+/);

    const chunks = [];
    let current = '';

    for (const sentence of rawSentences) {
        if (!sentence) continue;

        // If adding this sentence would overflow the current chunk
        if ((current + ' ' + sentence).length > maxChars) {
            if (current) chunks.push(current.trim());

            // Start new chunk; if the sentence is itself very long, just force it
            if (sentence.length > maxChars) {
                chunks.push(sentence.trim());
                current = '';
            } else {
                current = sentence;
            }
        } else {
            current = current ? `${current} ${sentence}` : sentence;
        }
    }

    if (current) chunks.push(current.trim());

    // Add simple overlap by copying trailing text from previous chunk
    if (overlap > 0 && chunks.length > 1) {
        const withOverlap = [];
        for (let i = 0; i < chunks.length; i++) {
            if (i === 0) {
                withOverlap.push(chunks[i]);
            } else {
                const prev = chunks[i - 1];
                const tail = prev.slice(-overlap); // last N chars of previous chunk
                withOverlap.push(`${tail} ${chunks[i]}`.trim());
            }
        }
        return withOverlap;
    }

    return chunks;
}

async function main() {
    const citiesDir = path.join(__dirname, 'data', 'cities');
    const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith('.txt'));
    if (!files.length) {
        console.error('No city files in data/cities');
        process.exit(1);
    }

    console.log('Clearing existing city chunks...');
    await clearCityChunks();

    for (const file of files) {
        const city = path.basename(file, '.txt'); // "boston", "portland"
        const fullPath = path.join(citiesDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');

        console.log(`Processing city: ${city}`);
        const chunks = splitIntoChunks(content);
        for (let i = 0; i < chunks.length; i++) {
            const text = chunks[i];
            console.log(`  Embedding chunk ${i + 1}/${chunks.length}...`);
            const embedding = await embedText(text);
            await insertCityChunk({ city, chunkIndex: i, text, embedding });
        }
    }

    console.log('Done ingesting city documents.');
}

main().catch((err) => {
    console.error(err.response?.data || err);
    process.exit(1);
});