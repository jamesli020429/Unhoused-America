// backend/rag.js
import { embedText, generateText, generateFreshName } from './gemini.js';
import { getCityChunks, getLastNames, getLastNamesForCombo } from './database.js';
import { DAY_ENVIRONMENTS } from './data/environments-day.js';
import { NIGHT_ENVIRONMENTS } from './data/environments-night.js';


// ---------- Similarity & basic helpers ----------

function cosineSimilarity(a, b) {
    let dot = 0, na = 0, nb = 0;
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

    // unified identity term space (gender + presentation + sexuality)
    const identityTerms = Array.from(
        new Set([...genders, ...presentations, ...sexualities])
    );

    return {
        age,
        disabilities,
        genders,
        presentations,
        sexualities,
        identityTerms
    };
}

// checking for unique names


export async function ensureUniqueName({ candidateName, demographics }) {
    const baseName = (candidateName || '').trim();
    const d = demographics;

    const lastOverall = await getLastNames(20);
    const lastForCombo = await getLastNamesForCombo(
        d.raceEthnicity,
        d.genderExpression,
        10
    );

    const forbidden = new Set(
        [...lastOverall, ...lastForCombo]
            .filter(Boolean)
            .map((n) => n.toLowerCase())
    );

    if (!forbidden.has(baseName.toLowerCase())) {
        // Already unique enough
        return baseName;
    }

    // Need to generate a fresh name
    const forbiddenArray = Array.from(forbidden);
    const attempt1 = await generateFreshName({
        demographics: d,
        forbiddenNames: forbiddenArray
    });

    if (!forbidden.has(attempt1.toLowerCase())) {
        return attempt1;
    }

    // One more attempt with an expanded forbidden list
    forbiddenArray.push(attempt1);
    const attempt2 = await generateFreshName({
        demographics: d,
        forbiddenNames: forbiddenArray
    });

    if (!forbidden.has(attempt2.toLowerCase())) {
        return attempt2;
    }

    // If all else fails, just return last attempt
    return attempt2;
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
        ...toArray(rule.sexuality || [])
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
    if (!rules.length) return true; // open to all

    // eligible if ANY rule object matches
    return rules.some((rule) => matchesOneEligibilityRule(rule, personNorm));
}

// env is DAY_ENVIRONMENTS[key] or NIGHT_ENVIRONMENTS[key]
function chooseResourceForCity(env, city, demographics) {
    const perCity = env.resourcesPerCity || {};
    const cityKey = normalizeCityKey(city);
    const list = perCity[cityKey] || [];
    if (!list.length) return null;

    const personNorm = normalizeDemographicsForEligibility(demographics);
    const eligible = list.filter((res) => isResourceEligibleForPerson(res, personNorm));
    if (!eligible.length) return null;

    const idx = Math.floor(Math.random() * eligible.length);
    return eligible[idx]; // { name, eligibility? }
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

    // Example soft preferences; tweak as desired
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

export async function generateNarrative({ city, demographics }) {
    // 1) Load pre-embedded chunks for this city
    const chunks = await getCityChunks(normalizeCityKey(city));
    if (!chunks.length) {
        throw new Error(
            `No chunks found for city "${city}". Did you run npm run ingest:cities?`
        );
    }

    // 2) Embed only the query (one embedding call)
    const retrievalQuery = `
Key context about homelessness in ${city}, including likely life paths into homelessness, barriers to housing and services, and local patterns that could shape an individual's story.
Demographics: ${JSON.stringify(demographics)}
`.trim();

    const qEmbed = await embedText(retrievalQuery);

    // 3) Score chunks locally
    const scored = chunks.map((c) => ({
        ...c,
        score: cosineSimilarity(qEmbed, c.embedding)
    }));
    scored.sort((a, b) => b.score - a.score);

    // 4) Top-N + random sample K for variation
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

    // 5) Random day & night environments with city-specific resources

    const dayChoice = chooseEnvironmentFromSet(DAY_ENVIRONMENTS, demographics);
    const nightChoice = chooseEnvironmentFromSet(NIGHT_ENVIRONMENTS, demographics);

    const dayResource = chooseResourceForCity(dayChoice.env, city, demographics);
    const nightResource = chooseResourceForCity(nightChoice.env, city, demographics);

    const dayType = (dayChoice.env.label || 'location').toLowerCase();
    const nightType = (nightChoice.env.label || 'location').toLowerCase();

    const dayEnvDisplay = dayResource?.name
        ? `${dayResource.name}, a ${dayType}`
        : `a ${dayType}`;

    const nightEnvDisplay = nightResource?.name
        ? `${nightResource.name}, a ${nightType}`
        : `a ${nightType}`;

    const dayEnvSentence = buildEnvironmentSentence({
        env: dayChoice.env,
        resource: dayResource,
        timeOfDay: 'day'
    });

    const nightEnvSentence = buildEnvironmentSentence({
        env: nightChoice.env,
        resource: nightResource,
        timeOfDay: 'night'
    });

    function buildSentence() {
        const dayOrNight = ['day', 'night'].filter(Boolean);
        const chosenTime =
            dayOrNight.length > 0
                ? dayOrNight[Math.floor(Math.random() * dayOrNight.length)]
                : 'day';

        const chosenEnviro =
            chosenTime === 'day'
                ? chooseEnvironmentFromSet(DAY_ENVIRONMENTS, demographics)
                : chooseEnvironmentFromSet(NIGHT_ENVIRONMENTS, demographics);

        const EnvironmentSentence = buildEnvironmentSentence({
            env: chosenEnviro.env,
            resource: chosenEnviro.resource,
            timeOfDay: chosenTime,
        });

        const location = chosenEnviro.env

        return { EnvironmentSentence, location }
    }

    const environment = buildSentence();

    // Pick either day or night environment at random, if available
    // const envOptions = [dayEnvSentence, nightEnvSentence].filter(Boolean);
    // const chosenEnv =
    //     envOptions.length > 0
    //         ? envOptions[Math.floor(Math.random() * envOptions.length)]
    //         : `a typical location in ${demographics.city}`;

    //     const envContext = `
    // Daytime environment:
    // ${dayEnvSentence}

    // ---

    // Nighttime environment:
    // ${nightEnvSentence}
    // `.trim();

    // 6) Demographics text (as in your original prompt)

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

    // 7) Prompt

    const prompt = `
You are a careful, empathetic writer creating short fictional biographies of people experiencing homelessness.

Follow these rules:
- Use ONLY the information in the context and the person details provided.
- Do NOT mention statistics, numerical rates, or specific percentages (for example, do not say “27%” or “1 in 5”). Instead, reflect the implications of those statistics using qualitative language like “it is common,” “many,” or “more likely.”
- Write in the THIRD PERSON.
- Length: under 300 words.
- Tone: slightly informal but primarily biographical, not diary-like or overly dramatic. However, it has emotional depth and nuance that aims to build empathy and understanding.
- Be respectful and avoid sensationalizing homelessness.
- Avoid stereotypes and avoid exaggerating trauma. Make the story realistic, grounded in the described city and environment.
- Do not contradict any of the person’s identities.
- Focus on one or two aspects of their identity when describing how it shapes their life journey. It is not important to include all of the demographics listed
- The story should connect clearly to how they became homeless and what their life looks like now.
- Weave the environment into the story in a natural way. If the selected environment is a specific local location, you may mention it by name or specifics details about it naturally if it adds to the story. Do not invent new resource names.

Context about homelessness in this city:
${cityContext}

Context about the specific environments:
${environment.EnvironmentSentence}

Person details:
${demographicsText}

Task:
1. Invent a realistic first name and an exact age (within the given age range) for this person.
2. Then write a short, third-person life story for this person following the rules above.
3. Start your response in this format:

Name: [First name]
Age: [Number]

[Then the narrative paragraphs]
`.trim();

    const text = await generateText(prompt);

    let name = '';
    let age = null;
    let narrative = text;

    const nameMatch = text.match(/Name:\s*(.+)/i);
    const ageMatch = text.match(/Age:\s*(\d+)/i);
    if (nameMatch) name = nameMatch[1].trim();
    if (ageMatch) age = parseInt(ageMatch[1], 10);
    narrative = text.replace(/Name:.*\n?Age:.*\n?/i, '').trim();

    return {
        name,
        age,
        narrative,
        dayEnvironmentKey: dayChoice.key,
        nightEnvironmentKey: nightChoice.key,
        dayResourceName: dayResource?.name || null,
        nightResourceName: nightResource?.name || null,
        dayEnvironmentDisplay: dayEnvDisplay,
        nightEnvironmentDisplay: nightEnvDisplay,
        chosenEnvironment: environment.EnvironmentSentence,
        imageLocation: environment.location.label
    };
}

