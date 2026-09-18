// backend-cloudflare/src/rag.js
import { embedText, generateText, generateFreshName } from './gemini.js';
import { getCityChunks, getLastNames, getLastNamesForCombo } from './database.js';
import { DAY_ENVIRONMENTS } from './data/environments-day.js';
import { NIGHT_ENVIRONMENTS } from './data/environments-night.js';

// ---------- Similarity & basic helpers ----------

function cosineSimilarity(a, b) {
    let dot = 0,
        na = 0,
        nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function weightedRandomChoice(weightMap) {
    const entries = Object.entries(weightMap).filter(([, w]) => w > 0);
    if (!entries.length) return null;
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [key, w] of entries) {
        r -= w;
        if (r <= 0) return key;
    }
    return entries[entries.length - 1][0];
}

function normalizeCityKey(city) {
    const t = (city || '').toLowerCase().trim();

    if (t.startsWith('atlanta')) return 'atlanta';
    if (t.startsWith('boston')) return 'boston';
    if (t.startsWith('washington')) return 'dc';
    if (t === 'dc') return 'dc';
    if (t.startsWith('los angeles') || t === 'la') return 'LA';
    if (t.startsWith('new york') || t === 'nyc' || t === 'ny') return 'NYC';
    if (t.startsWith('portland')) return 'portland';

    return t;
}

function toArray(val) {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
}

function intersects(listA, listB) {
    if (!listA.length || !listB.length) return false;
    const setB = new Set(listB.map((x) => x.toLowerCase()));
    return listA.some((x) => setB.has(x.toLowerCase()));
}

function parseAgeRangeBounds(ageRange) {
    const txt = String(ageRange || '').trim();
    const m = txt.match(/(\d{1,2})\s*[-to]+\s*(\d{1,2})/i);
    if (!m) return null;
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return { min: Math.min(a, b), max: Math.max(a, b) };
}

function normalizeAge(age, ageRange) {
    const bounds = parseAgeRangeBounds(ageRange);
    if (!bounds) {
        return Number.isFinite(age) ? age : null;
    }

    if (Number.isFinite(age) && age >= bounds.min && age <= bounds.max) {
        return age;
    }

    return bounds.min + Math.floor(Math.random() * (bounds.max - bounds.min + 1));
}

function sanitizeFirstName(raw) {
    const firstLine = String(raw || '').replace(/\r/g, ' ').split('\n')[0].trim();
    const cleaned = firstLine.replace(/^name\s*:\s*/i, '').replace(/^[-*]\s*/, '').trim();
    const match = cleaned.match(/[\p{L}][\p{L}'-]{1,31}/u);
    if (!match) return '';

    const candidate = match[0];
    const blocked = new Set(['the', 'name', 'possible', 'names', 'single', 'given', 'middle']);
    if (blocked.has(candidate.toLowerCase())) return '';

    return candidate;
}

function buildFallbackNamePool(demographics) {
    const expression = String(demographics?.genderExpression || '').toLowerCase();
    const identity = String(demographics?.genderIdentity || '').toLowerCase();
    const combined = `${expression} ${identity}`;

    const feminine = [
        'Maria', 'Lucia', 'Elena', 'Carmen', 'Sofia', 'Marisol', 'Xiomara', 'Ana', 'Valeria', 'Isabel',
    ];
    const masculine = [
        'Rafael', 'Miguel', 'Daniel', 'Javier', 'Malik', 'Andre', 'Darius', 'Carlos', 'Luis', 'Mateo',
    ];
    const neutral = [
        'Alex', 'Jordan', 'Taylor', 'Casey', 'River', 'Avery', 'Rowan', 'Quinn', 'Sage', 'Kai',
    ];

    if (combined.includes('feminine') || combined.includes('woman') || combined.includes('female')) {
        return [...feminine, ...neutral];
    }

    if (combined.includes('masculine') || combined.includes('man') || combined.includes('male')) {
        return [...masculine, ...neutral];
    }

    return [...neutral, ...feminine, ...masculine];
}

function cleanNarrativeText(raw) {
    let out = String(raw || '');

    out = out
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '');

    out = out.replace(/^\s*name\s*:\s*.*$/gim, '');
    out = out.replace(/^\s*age\s*:\s*\d+.*$/gim, '');

    // Remove instruction leakage that occasionally appears in model output.
    out = out.replace(/-\s*The name should be a single, given name \(no middle name\)\.?/gi, '');
    out = out.replace(/Possible names\s*:/gi, '');

    out = out.replace(/\s{2,}/g, ' ').trim();
    return out;
}

function tryParseFirstJsonObject(raw) {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw !== 'string') return null;

    const trimmed = raw.trim();
    try {
        return JSON.parse(trimmed);
    } catch {
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            try {
                return JSON.parse(trimmed.slice(start, end + 1));
            } catch {
                return null;
            }
        }
        return null;
    }
}

function parseNarrativeModelOutput(raw, ageRange) {
    const parsed = tryParseFirstJsonObject(raw);

    let name = '';
    let age = null;
    let narrative = '';

    if (parsed && typeof parsed === 'object') {
        name = sanitizeFirstName(parsed.name);
        age = normalizeAge(Number(parsed.age), ageRange);
        
        const rawNarrative = parsed.narrative;
        if (Array.isArray(rawNarrative)) {
            narrative = rawNarrative.map(p => cleanNarrativeText(String(p || ''))).filter(Boolean).join('\n\n');
        } else {
            narrative = cleanNarrativeText(String(rawNarrative || ''));
        }
    }

    if (!name || !narrative) {
        const text = String(raw || '');
        const nameMatch = text.match(/Name:\s*(.+)/i) || text.match(/"name"\s*:\s*"([^"]+)"/i);
        const ageMatch = text.match(/Age:\s*(\d+)/i) || text.match(/"age"\s*:\s*(\d+)/i);

        if (!name && nameMatch) name = sanitizeFirstName(nameMatch[1]);
        if (!age && ageMatch) age = normalizeAge(parseInt(ageMatch[1], 10), ageRange);

        if (!narrative) {
            // Try to match narrative inside malformed JSON (could be array or string)
            const narrativeArrayMatch = text.match(/"narrative"\s*:\s*\[([\s\S]+?)\]/i);
            const narrativeStringMatch = text.match(/"narrative"\s*:\s*"([\s\S]+?)"/i);

            if (narrativeArrayMatch) {
                // Parse the array values manually
                const arrayContent = narrativeArrayMatch[1];
                const paragraphs = arrayContent
                    .split(/",\s*"/g)
                    .map(p => p.replace(/^["\s]+|["\s]+$/g, '').trim())
                    .filter(Boolean);
                narrative = paragraphs.map(p => cleanNarrativeText(p)).join('\n\n');
            } else if (narrativeStringMatch) {
                narrative = cleanNarrativeText(narrativeStringMatch[1]);
            } else {
                narrative = cleanNarrativeText(text.replace(/Name:.*\n?Age:.*\n?/i, '').replace(/[\{\}]|"[a-zA-Z0-9_]+"\s*:/g, '').trim());
            }
        }
    }

    if (!name) name = 'Alex';
    if (!age) age = normalizeAge(null, ageRange) || 30;

    return { name, age, narrative };
}

// ---------- Demographic normalization for eligibility ----------

function normalizeDemographicsForEligibility(d) {
    const toList = (val) =>
        (val || '')
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

    const age = (d.ageRange || '').toLowerCase().trim();
    const disabilities = toList(d.disabilityStatus || '');
    const genders = toList(d.genderIdentity || '');
    const presentations = toList(d.genderExpression || '');
    const sexualities = toList(d.sexualOrientation || '');

    const identityTerms = Array.from(new Set([...genders, ...presentations, ...sexualities]));

    return {
        age,
        disabilities,
        genders,
        presentations,
        sexualities,
        identityTerms,
    };
}

// checking for unique names
export async function ensureUniqueName({ candidateName, demographics }, env) {
    const baseName = sanitizeFirstName(candidateName);
    const d = demographics;

    const lastOverall = await getLastNames(20, env);
    const lastForCombo = await getLastNamesForCombo(d.raceEthnicity, d.genderExpression, 10, env);

    const forbidden = new Set(
        [...lastOverall, ...lastForCombo]
            .map((n) => sanitizeFirstName(n))
            .filter(Boolean)
            .map((n) => n.toLowerCase())
    );

    if (baseName && !forbidden.has(baseName.toLowerCase())) {
        return baseName;
    }

    // Try model-generated names, but sanitize aggressively.
    for (let i = 0; i < 3; i++) {
        const attemptRaw = await generateFreshName(
            {
                demographics: d,
                forbiddenNames: Array.from(forbidden),
            },
            env
        );

        const attempt = sanitizeFirstName(attemptRaw);
        if (attempt && !forbidden.has(attempt.toLowerCase())) {
            return attempt;
        }

        if (attempt) {
            forbidden.add(attempt.toLowerCase());
        }
    }

    // Deterministic fallback if model output is malformed.
    const fallbackPool = buildFallbackNamePool(d);
    for (const candidate of fallbackPool) {
        if (!forbidden.has(candidate.toLowerCase())) {
            return candidate;
        }
    }

    return 'Alex';
}

// ---------- Resource eligibility rules ----------

function matchesOneEligibilityRule(rule, person) {
    // Age: must match if specified
    if (rule.age) {
        const allowedAges = toArray(rule.age).map((a) => a.toLowerCase());
        if (!allowedAges.includes(person.age)) return false;
    }

    // Disability: must have at least one if specified
    if (rule.disability) {
        const allowedDisabilities = toArray(rule.disability);
        if (!intersects(person.disabilities, allowedDisabilities)) return false;
    }

    // Identity terms (gender / presentation / sexuality) are interchangeable
    const allowedIdentityTerms = [
        ...toArray(rule.gender || []),
        ...toArray(rule.presentation || []),
        ...toArray(rule.sexuality || []),
    ].map((x) => x.toLowerCase());

    if (allowedIdentityTerms.length > 0) {
        if (!intersects(person.identityTerms, allowedIdentityTerms)) {
            return false;
        }
    }

    return true;
}

function isResourceEligibleForPerson(resource, personNorm) {
    const rules = resource.eligibility || [];
    if (!rules.length) return true;
    return rules.some((rule) => matchesOneEligibilityRule(rule, personNorm));
}

function chooseResourceForCity(env, city, demographics) {
    const perCity = env.resourcesPerCity || {};
    const cityKey = normalizeCityKey(city);
    const list = perCity[cityKey] || [];
    if (!list.length) return null;

    const personNorm = normalizeDemographicsForEligibility(demographics);
    const eligible = list.filter((res) => isResourceEligibleForPerson(res, personNorm));
    if (!eligible.length) return null;

    const idx = Math.floor(Math.random() * eligible.length);
    return eligible[idx];
}

// ---------- Environment selection ----------

function chooseEnvironmentFromSet(envs, demographics) {
    const weights = {};
    for (const [key, val] of Object.entries(envs)) {
        weights[key] = val.baseWeight ?? 1;
    }

    const isParent =
        (demographics.parentStatus || '').toLowerCase().includes('father') ||
        (demographics.parentStatus || '').toLowerCase().includes('mother') ||
        (demographics.parentStatus || '').toLowerCase().includes('parent');

    if (isParent && envs.public_library) {
        weights.public_library = (weights.public_library || 0) + 1;
    }
    if (isParent && envs.food_pantry) {
        weights.food_pantry = (weights.food_pantry || 0) + 1;
    }

    const key = weightedRandomChoice(weights) || Object.keys(envs)[0];
    return { key, env: envs[key] };
}

function buildEnvironmentSentence({ env, resource, timeOfDay }) {
    const typeLabel = env.label || 'location';
    const typeLower = typeLabel.toLowerCase();

    const prefix =
        timeOfDay === 'day'
            ? 'This person spends their day'
            : 'This person spends their night';

    if (resource && resource.name) {
        // With city-specific resource
        return `${prefix} at ${resource.name}, ${typeLower}. ${env.description}`;
    }

    // No city-specific resource (or none eligible)
    return `${prefix} at a ${typeLower}. ${env.description}`;
}

// ---------- Main narrative generation ----------

export async function generateNarrative({ city, demographics }, env) {
    // 0) Normalize demographics for later use
    const personNorm = normalizeDemographicsForEligibility(demographics);

    // 1) Choose a primary environment (day or night) up front
    const primaryTimeOfDay = Math.random() < 0.5 ? 'day' : 'night';
    const primaryEnvSet = primaryTimeOfDay === 'day' ? DAY_ENVIRONMENTS : NIGHT_ENVIRONMENTS;

    const primaryEnvChoice = chooseEnvironmentFromSet(primaryEnvSet, demographics);
    const primaryResource = chooseResourceForCity(primaryEnvChoice.env, city, demographics);

    const primaryEnvSentence = buildEnvironmentSentence({
        env: primaryEnvChoice.env,
        resource: primaryResource,
        timeOfDay: primaryTimeOfDay,
    });

    // (Optional) Still choose a separate day/night pair for logging/UX if you want:
    const dayChoice = chooseEnvironmentFromSet(DAY_ENVIRONMENTS, demographics);
    const nightChoice = chooseEnvironmentFromSet(NIGHT_ENVIRONMENTS, demographics);
    const dayResource = chooseResourceForCity(dayChoice.env, city, demographics);
    const nightResource = chooseResourceForCity(nightChoice.env, city, demographics);

    // 2) Build environment-related keywords for retrieval
    const envKeywords = [
        primaryEnvChoice.env.label,
        primaryEnvChoice.env.type,
        ...(primaryEnvChoice.env.tags || []),
        primaryResource?.name,
        primaryResource?.population,
        ...(primaryResource?.tags || []),
    ]
        .filter(Boolean)
        .join(', ');

    // 3) Load pre-embedded chunks for this city
    const chunks = await getCityChunks(normalizeCityKey(city), env);
    if (!chunks.length) {
        throw new Error(
            `No chunks found for city "${city}". Did you run the ingestion script?`
        );
    }

    // 4) Embed only the query (now includes environment + normalized identity terms)
    const retrievalQuery = `
City: ${city}
Need: key context about homelessness, including likely life paths into homelessness, barriers to housing and services, and local patterns that could shape an individual's story.

Demographics (raw): ${JSON.stringify(demographics)}
Demographic identity terms (normalized): ${JSON.stringify(personNorm.identityTerms)}

Primary environment focus:
- Time of day: ${primaryTimeOfDay}
- Environment label: ${primaryEnvChoice.env.label || ''}
- Environment type: ${primaryEnvChoice.env.type || ''}
- Resource: ${primaryResource?.name || 'none'}
- Environment-related keywords: ${envKeywords}
`.trim();

    const qEmbed = await embedText(retrievalQuery, env);

    // 5) Score chunks locally
    const scored = chunks.map((c) => ({
        ...c,
        score: cosineSimilarity(qEmbed, c.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);

    // 6) Top-N + random sample K for variation
    const TOP_N = 8;
    const K = 4;
    const candidates = scored.slice(0, Math.min(TOP_N, scored.length));
    const selected = [];
    const pool = [...candidates];
    while (selected.length < K && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        selected.push(pool[idx]);
        pool.splice(idx, 1);
    }

    const cityContext = selected
        .map((c, i) => `City Source ${i + 1}:\n${c.text}`)
        .join('\n\n---\n\n');

    // 7) Demographics text
    const d = demographics;
    const demographicsText = `
- Housing status: unhoused
- Location: ${city}
- Gender expression: ${d.genderExpression}
- Gender identity: ${d.genderIdentity}
- Race/ethnicity: ${d.raceEthnicity}
- Sexual orientation: ${d.sexualOrientation}
- Relationship status: ${d.relationshipStatus}
- Parent status: ${d.parentStatus}
- Age range: ${d.ageRange}
- Disability status: ${d.disabilityStatus}
- Education: ${d.education}
`.trim();

    const prompt = `
You are a careful, empathetic writer creating detailed, character-driven biographies of people experiencing homelessness.

Follow these rules:
- Use ONLY the information in the context and the person details provided.
- Do NOT mention statistics, numerical rates, or specific percentages (for example, do not say "27%" or "1 in 5"). Instead, reflect the implications of those statistics using qualitative language like "it is common," "many," or "more likely."
- Write in the THIRD PERSON.
- Length: between 250 and 300 words.
- Structure: Write exactly 2 to 3 distinct paragraphs. The first paragraph should focus on their background and the journey/circumstances that led to them becoming homeless. The subsequent paragraphs should describe their current day-to-day life, coping mechanisms, and their relationship with the specified local environment or resource.
- Tone: slightly informal but primarily biographical, with emotional depth and nuance that builds empathy and understanding.
- Avoid stereotypes and avoid exaggerating trauma. Make the story highly realistic, specific, and grounded in the described city and environment.
- Do not contradict any of the person's identities.
- Focus on one or two aspects of their identity or context when describing how it shapes their life journey. It is not important to include all of the demographics or all of the context listed.
- Weave the environment into the story in a natural way. If the selected environment is a specific local location, you may mention it by name or specific details about it naturally if it adds to the story. Do not invent new resource names.
- **Accurately represent shelter status**: Pay close attention to the specified environment (such as transitional housing, overnight shelters, living with friends/family, or a vehicle). If the environment indicates they are staying in transitional housing, a shelter, or couch-surfing with friends/family, the story must reflect this level of shelter and support, and must NOT imply that they sleep on the streets or in public unsheltered spaces. Show that homelessness encompasses many situations (like temporary programs or doubled-up living), not just unsheltered street living.

Context about homelessness in this city:
${cityContext}

Context about the specific environment:
${primaryEnvSentence}

Person details:
${demographicsText}

Task:
1. Invent a realistic first name and an exact age (within the given age range) for this person.
2. Write a detailed, third-person life story for this person following the rules above.
3. Return ONLY valid JSON with exactly this structure:
{
  "name": "Firstname",
  "age": 22,
  "narrative": [
    "First paragraph text...",
    "Second paragraph text..."
  ]
}
4. The "narrative" key must be a JSON array of strings, where each element is a single paragraph. This avoids escaping newlines inside the JSON string and makes parsing robust.
5. The name must be a single given name (no surname, no bullets, no lists, no extra commentary).
`.trim();

    const text = await generateText(prompt, {}, env);
    const { name, age, narrative } = parseNarrativeModelOutput(text, d.ageRange);

    return {
        name,
        age,
        narrative,
        // Optional: still expose these for UI or analytics
        dayEnvironmentKey: dayChoice.key,
        nightEnvironmentKey: nightChoice.key,
        dayResourceName: dayResource?.name || null,
        nightResourceName: nightResource?.name || null,
        chosenEnvironment: primaryEnvSentence,
        imageLocation: primaryEnvChoice.env.label,
    };
}
