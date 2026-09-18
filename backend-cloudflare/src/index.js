// backend-cloudflare/src/index.js
import { generateNarrative, ensureUniqueName } from './rag.js';
import { extractVisualDetails, buildImagePromptFromVisuals, generateImage, uploadImageToGitHub } from './gemini.js';
import { createPersona, getPersona, listPersonas, listPersonasPaginated, getRawPersona } from './database.js';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to parse JSON body
async function parseJSON(request) {
    try {
        return await request.json();
    } catch {
        return null;
    }
}

// Helper to create JSON response
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
        },
    });
}

function normalizeCityDisplayName(city) {
    const key = String(city || '').trim().toLowerCase();

    const aliases = {
        nyc: 'New York',
        'new york': 'New York',
        la: 'Los Angeles',
        'los angeles': 'Los Angeles',
        dc: 'Washington, DC',
        washington: 'Washington, DC',
        boston: 'Boston',
        atlanta: 'Atlanta',
        portland: 'Portland',
    };

    return aliases[key] || String(city || '').trim();
}

// Main request handler
export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Route: POST /api/personas - Create persona
            if (path === '/api/personas' && request.method === 'POST') {
                const body = await parseJSON(request);

                if (!body || !body.city || !body.demographics) {
                    return jsonResponse({ error: 'city and demographics are required' }, 400);
                }

                const { city, demographics } = body;
                const displayCity = normalizeCityDisplayName(city);

                // Generate narrative using RAG
                let { name, age, narrative, imageLocation } = await generateNarrative(
                    { city: displayCity, demographics },
                    env
                );

                // Enforce name uniqueness
                const uniqueName = await ensureUniqueName(
                    { candidateName: name, demographics },
                    env
                );

                // Update narrative if name changed
                if (uniqueName && uniqueName !== name) {
                    const safeOld = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const nameRegex = new RegExp(`\\b${safeOld}\\b`, 'g');
                    narrative = narrative.replace(nameRegex, uniqueName);
                    name = uniqueName;
                }

                // Extract visual details for image generation
                const visuals = await extractVisualDetails(
                    { name, age, demographics, narrative },
                    env
                );

                // Build and generate image
                const imagePrompt = buildImagePromptFromVisuals(
                    visuals,
                    displayCity,
                    demographics,
                    imageLocation
                );
                const base64Image = await generateImage(imagePrompt, { model: 'gemini' }, env);

                // Upload image to GitHub and get permanent URL
                const imageUrl = await uploadImageToGitHub(base64Image, env);
                if (!imageUrl) {
                    throw new Error('Failed to upload image to GitHub');
                }

                // Save to database
                const id = await createPersona(
                    { city: displayCity, demographics, name, age, narrative, imageUrl },
                    env
                );

                return jsonResponse({ id }, 201);
            }

            // Route: GET /api/personas - List personas
            if (path === '/api/personas' && request.method === 'GET') {
                const limitParam = Number(url.searchParams.get('limit'));
                const pageParam = Number(url.searchParams.get('page'));

                const filters = {
                    city: url.searchParams.getAll('city'),
                    presentation: url.searchParams.getAll('presentation'),
                    gender: url.searchParams.getAll('gender'),
                    race: url.searchParams.getAll('race'),
                    orientation: url.searchParams.getAll('orientation'),
                    maritalStatus: url.searchParams.getAll('maritalStatus'),
                    dependents: url.searchParams.getAll('dependents'),
                    age: url.searchParams.getAll('age'),
                    education: url.searchParams.getAll('education'),
                    disabilities: url.searchParams.getAll('disabilities'),
                };

                const baseUrl = new URL(request.url).origin;
                const hasFilters = Object.values(filters).some((vals) => vals.length > 0);
                const hasPagination = Number.isFinite(pageParam) && pageParam > 0;

                if (hasFilters || hasPagination) {
                    const paged = await listPersonasPaginated(
                        {
                            page: hasPagination ? pageParam : 1,
                            limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 12,
                            filters,
                        },
                        baseUrl,
                        env
                    );
                    return jsonResponse(paged);
                }

                const safeLimit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;
                const personas = await listPersonas(safeLimit, baseUrl, env);
                return jsonResponse(personas);
            }

            // Route: GET /api/personas/:id/image - Get cached persona image from GitHub
            if (path.match(/^\/api\/personas\/\d+\/image$/)) {
                const id = path.split('/')[3];
                const persona = await getRawPersona(id, env);
                if (!persona || !persona.image_url) {
                    return jsonResponse({ error: 'Image not found' }, 404);
                }

                // Fetch image from GitHub and return with cache headers
                try {
                    const imgResp = await fetch(persona.image_url);
                    if (!imgResp.ok) {
                        return jsonResponse({ error: 'Failed to fetch image from GitHub' }, 500);
                    }

                    const contentType = imgResp.headers.get('content-type') || 'image/png';
                    const buffer = await imgResp.arrayBuffer();

                    // Return with aggressive cache headers (1 year = 31536000 seconds)
                    return new Response(buffer, {
                        status: 200,
                        headers: {
                            'Content-Type': contentType,
                            'Cache-Control': 'public, max-age=31536000, immutable',
                            'ETag': `"${id}"`,
                            ...corsHeaders,
                        },
                    });
                } catch (err) {
                    console.error('Image fetch error:', err);
                    return jsonResponse({ error: 'Failed to fetch image' }, 500);
                }
            }

            // Route: GET /api/personas/:id - Get single persona
            if (path.startsWith('/api/personas/') && request.method === 'GET') {
                const id = path.split('/')[3];
                if (!id) {
                    return jsonResponse({ error: 'Invalid persona ID' }, 400);
                }

                const baseUrl = new URL(request.url).origin;
                const persona = await getPersona(id, baseUrl, env);
                if (!persona) {
                    return jsonResponse({ error: 'Not found' }, 404);
                }

                const { demographics_json, ...rest } = persona;
                return jsonResponse({
                    ...rest,
                    demographics: JSON.parse(demographics_json || '{}'),
                });
            }

            // Route: GET / - Health check
            if (path === '/' || path === '/health') {
                return jsonResponse({ status: 'ok', message: 'Unhoused America API' });
            }


            // Route: POST /api/cache-images - Pre-warm cache for all images
            if (path === '/api/cache-images' && request.method === 'POST') {
                try {
                    const stmt = env.DB.prepare(`SELECT id FROM personas WHERE image_url != ''`);
                    const result = await stmt.all();
                    const personaIds = (result.results || []).map(r => r.id);

                    let cached = 0;
                    for (const id of personaIds) {
                        const persona = await getRawPersona(id, env);
                        if (persona?.image_url) {
                            try {
                                const imgResp = await fetch(persona.image_url);
                                if (imgResp.ok) {
                                    await imgResp.arrayBuffer(); // consume response
                                    cached++;
                                }
                            } catch (err) {
                                console.error(`Failed to cache image for persona ${id}:`, err.message);
                            }
                        }
                    }

                    return jsonResponse({ message: `Cached ${cached} images`, count: cached }, 200);
                } catch (err) {
                    console.error('Cache warming error:', err);
                    return jsonResponse({ error: 'Cache warming failed' }, 500);
                }
            }

            // 404
            return jsonResponse({ error: 'Not found' }, 404);
        } catch (err) {
            console.error('Error:', err);
            return jsonResponse(
                { error: 'Internal server error', message: err.message },
                500
            );
        }
    },
};
