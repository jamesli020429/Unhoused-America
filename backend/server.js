// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { generateNarrative, ensureUniqueName } from './rag.js';
import { extractVisualDetails, buildImagePromptFromVisuals, generateImage } from './gemini.js';
import { createPersona, getPersona, listPersonas } from './database.js';

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

// Create persona
app.post('/api/personas', async (req, res) => {
    try {
        const { city, demographics } = req.body;
        if (!city || !demographics) {
            return res.status(400).json({ error: 'city and demographics are required' });
        }

        let {
            name,
            age,
            narrative,
            imageLocation
        } = await generateNarrative({ city, demographics });

        // Enforce name uniqueness
        const uniqueName = await ensureUniqueName({ candidateName: name, demographics });

        // If the model used the old name inside the narrative, swap it out
        if (uniqueName && uniqueName !== name) {
            const safeOld = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
            const nameRegex = new RegExp(`\\b${safeOld}\\b`, 'g');
            narrative = narrative.replace(nameRegex, uniqueName);
            name = uniqueName;
        }

        const visuals = await extractVisualDetails({
            name,
            age,
            demographics,
            narrative
        });

        const imagePrompt = buildImagePromptFromVisuals(visuals, city, demographics, imageLocation);

        // console.log('IMAGE PROMPT DETAILS:\n', visuals);
        // console.log('IMAGE PROMPT:\n', imagePrompt);

        const imageUrl = await generateImage(imagePrompt, { model: 'gemini' });

        const id = await createPersona({ city, demographics, name, age, narrative, imageUrl });

        res.status(201).json({ id });
    } catch (err) {
        console.error(err.response?.data || err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List personas for gallery
app.get('/api/personas', async (req, res) => {
    try {
        const personas = await listPersonas(50);
        res.json(personas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single persona
app.get('/api/personas/:id', async (req, res) => {
    try {
        const persona = await getPersona(req.params.id);
        if (!persona) return res.status(404).json({ error: 'Not found' });

        const { demographics_json, ...rest } = persona;
        res.json({
            ...rest,
            demographics: JSON.parse(demographics_json || '{}')
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
});