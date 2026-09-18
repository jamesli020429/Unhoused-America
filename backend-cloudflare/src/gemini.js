// backend-cloudflare/src/gemini.js
import axios from 'axios';

// Helper to get env vars (from Workers environment)
function getEnv(env, key) {
    return env[key] || '';
}

function parseJsonFromModelOutput(raw) {
    if (raw && typeof raw === 'object') {
        return raw;
    }

    if (typeof raw !== 'string') {
        throw new Error(`Model returned non-JSON type: ${typeof raw}`);
    }

    const trimmed = raw.trim();

    try {
        return JSON.parse(trimmed);
    } catch {
        // Some models wrap JSON in markdown fences or prose. Try extracting the first JSON object.
        const unwrapped = trimmed
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();

        const start = unwrapped.indexOf('{');
        const end = unwrapped.lastIndexOf('}');

        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(unwrapped.slice(start, end + 1));
        }

        throw new Error('Model did not return parseable JSON');
    }
}

function sanitizeGeneratedFirstName(raw) {
    const text = String(raw || '').replace(/\r/g, ' ').trim();

    // Prefer explicit patterns if present.
    const explicit = text.match(/(?:name\s*[:\-]\s*|final answer is\s*[:\-]\s*)([\p{L}][\p{L}'-]{1,31})/iu);
    if (explicit?.[1]) return explicit[1];

    const tokens = text.match(/[\p{L}][\p{L}'-]{1,31}/gu) || [];
    const blocked = new Set([
        'the', 'name', 'return', 'one', 'of', 'from', 'list', 'final', 'answer',
        'possible', 'names', 'single', 'given', 'middle', 'and', 'or', 'only',
        'here', 'is', 'a', 'realistic', 'suggestions', 'suggestion', 'first',
        'subject', 'individual', 'fictional', 'person', 'biography', 'for'
    ]);

    const picked = tokens.find((t) => !blocked.has(t.toLowerCase()));
    return picked || '';
}

// Upload base64 image to GitHub repo and return the raw content URL
export async function uploadImageToGitHub(base64DataUri, env) {
    const GITHUB_TOKEN = getEnv(env, 'GITHUB_TOKEN');
    const REPO_OWNER = 'zkdeocadiz';
    const REPO_NAME = 'unhoused-america-embodicons';
    const BRANCH = 'main';

    if (!GITHUB_TOKEN) {
        // Fallback for local/dev environments where GitHub upload is not configured.
        // The persona can still be created using the inline data URI.
        console.warn('GITHUB_TOKEN not found in environment; using inline image data URI');
        return base64DataUri;
    }

    // Parse data URI and extract base64
    const match = base64DataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
        console.error('Invalid data URI format');
        return null;
    }

    const base64Only = match[2];
    const contentType = match[1];
    const ext = contentType.includes('jpeg') ? 'jpg' : (contentType.split('/')[1] || 'png');
    const filename = `personas/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    try {
        // Create file in GitHub repo via API
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`;
        const response = await axios.put(
            url,
            {
                message: `Add persona image: ${filename}`,
                content: base64Only,
                branch: BRANCH,
            },
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'User-Agent': 'unhoused-america-backend',
                },
                validateStatus: () => true,
            }
        );

        if (response.status !== 201) {
            const errorMsg = JSON.stringify(response.data);
            throw new Error(`GitHub API returned ${response.status}: ${errorMsg}`);
        }

        // Return raw GitHub URL for the image
        const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${filename}`;
        console.info(`GitHub upload succeeded: ${filename}`);
        return rawUrl;
    } catch (err) {
        // Do not fail persona creation if GitHub is temporarily unavailable.
        // Use the generated image data URI as a fallback.
        console.error(`GitHub upload failed, falling back to inline image: ${err.message}`);
        return base64DataUri;
    }
}

// Text/story generation using Llama 3.1 Instruct hosted by Cloudflare
export async function generateText(prompt, { temperature = 0.6 } = {}, env) {
    const ACCOUNT_ID = getEnv(env, 'CLOUDFLARE_ACCOUNT_ID');
    const API_TOKEN = getEnv(env, 'CLOUDFLARE_API_TOKEN');
    const MODEL = '@cf/meta/llama-3.1-8b-instruct';
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const resp = await axios.post(
        url,
        {
            messages: [{ role: 'user', content: prompt }],
            temperature,
            top_p: 0.9,
            max_tokens: 600,
        },
        {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!resp.data?.result?.response) {
        console.error('Text generation error:', resp.data);
        throw new Error('Failed to generate text');
    }

    return resp.data.result.response;
}

// Embeddings using Cloudflare AI
export async function embedText(text, env) {
    const ACCOUNT_ID = getEnv(env, 'CLOUDFLARE_ACCOUNT_ID');
    const API_TOKEN = getEnv(env, 'CLOUDFLARE_API_TOKEN');
    const MODEL = '@cf/baai/bge-base-en-v1.5';
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const resp = await axios.post(
        url,
        { text },
        {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        }
    );

    if (!resp.data?.result?.data?.[0]) {
        console.error('Embedding error:', resp.data);
        throw new Error('Failed to generate embedding');
    }

    return resp.data.result.data[0];
}

// Extract visual details for image generation
export async function extractVisualDetails({ name, age, demographics, narrative }, env) {
    const prompt = `
From the following fictional biography and demographics, extract ONLY visual details
that are explicitly stated or strongly implied. It will be used by Stable Diffusion to create a respectful and accurate photograph of this person experiencing homelessness.

RULES
- Do NOT infer race, gender, or identity from stereotypes
- Do NOT invent details
- This person is experiencing homelessness; do NOT include any details that contradict this, unless the narrative explicitly states otherwise but do not rely on stereotypes. Treat them with respect and dignity.
- If something is not visually implied, omit it
- It should be a good description of the person represented in the biography
- Provide details for all four categories: appearance, clothing, expression, setting
    - Appearance should cover physical features like hair color/style, skin tone, notable features. It needs to match the age that is given.
    - Clothing should describe type, condition, and style of clothes worn
    - Expression can be happy, neutral, or contemplative, but not sad, angry, or distressed
    - Setting is a the resource. Do NOT invent a setting--just use what is explicitly stated or strongly implied in the biography. If no setting is implied, leave it blank.
- Output JSON only, no extra text

INPUT:
Demographics:
- Name: ${name}
- Age: ${age}
- Gender expression: ${demographics.genderExpression}
- Gender identity: ${demographics.genderIdentity}
- Race/ethnicity: ${demographics.raceEthnicity}

Biography:
${narrative}

JSON format:
{
  "appearance": "",
  "clothing": "",
  "expression": "",
  "setting": ""
}
`.trim();

    const modelOutput = await generateText(prompt, { temperature: 0.2 }, env);
    const parsed = parseJsonFromModelOutput(modelOutput);

    return {
        appearance: String(parsed?.appearance || '').trim(),
        clothing: String(parsed?.clothing || '').trim(),
        expression: String(parsed?.expression || '').trim(),
        setting: String(parsed?.setting || '').trim(),
    };
}

function buildGenderPresentationInstruction(demographics) {
    const expression = String(demographics?.genderExpression || '').toLowerCase();
    const identity = String(demographics?.genderIdentity || '').toLowerCase();
    const combined = `${expression} ${identity}`;

    if (combined.includes('feminine') || combined.includes('woman') || combined.includes('female')) {
        return 'The subject must clearly present feminine in appearance and styling, consistent with the selected demographics. Avoid masculine-coded facial features, facial hair, and masculine styling.';
    }

    if (combined.includes('masculine') || combined.includes('man') || combined.includes('male')) {
        return 'The subject must clearly present masculine in appearance and styling, consistent with the selected demographics. Avoid feminine-coded makeup and styling choices.';
    }

    if (combined.includes('nonbinary') || combined.includes('androgynous')) {
        return 'The subject should present androgynous/nonbinary in appearance and styling, consistent with the selected demographics, without forcing strongly gendered cues.';
    }

    return 'The subject appearance and styling must align with the selected gender expression and identity demographics.';
}

export function buildImagePromptFromVisuals(visuals, city, demographics, imageLocation) {
    const genderInstruction = buildGenderPresentationInstruction(demographics);
    const fallbackAppearance = `a ${demographics.genderExpression || 'person'} person, medium build, in the ${demographics.ageRange || 'adult'} age range`;

    return `
   A documentary photograph in 9:16 format (portrait) taken in a real-world environment.
Photographed by a human photographer using a full-frame DSLR camera.
Eye-level angle, camera placed several feet away from the subject.
${genderInstruction}
Wide framing, ${visuals.appearance || fallbackAppearance} in center and directly looking at camera, body visible above the waist, not full body, occupies more than 70% but less than 90% of the frame, relaxed posture, neutral expression, ${visuals.clothing || 'casual clothing'}. No portrait crop.

The person is in a ${imageLocation} in ${city}. This is visible in the background. Deep depth of field: both the subject and the environment are clearly in focus.

Natural ambient lighting from the environment.
No studio lighting, no backdrop, no controlled setup.
`.trim();
}

// Image Generation
export async function generateImage(prompt, { model = 'cloudflare' } = {}, env) {
    if (!prompt || !prompt.trim()) {
        throw new Error('Empty prompt passed to generateImage');
    }

    if (model === 'gemini') {
        return await generateImageGemini(prompt, env);
    }

    // Default: Cloudflare Stable Diffusion
    const ACCOUNT_ID = getEnv(env, 'CLOUDFLARE_ACCOUNT_ID');
    const API_TOKEN = getEnv(env, 'CLOUDFLARE_API_TOKEN');
    const MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const resp = await axios.post(
        url,
        {
            prompt,
            width: 1024,
            height: 512,
            num_steps: 20,
            guidance_scale: 7,
            negative_prompt: `studio portrait, headshot, cropped face, profile view, side view, looking away, illustration, painting, digital art, blurred background, shallow depth of field, airbrushed skin, perfect symmetry, concept art, unreal, fake, environment not in ${prompt}, environment only, no person, face not visible, multiple people, text, watermarks, distorted faces, distorted proportions, distorted body parts`,
        },
        {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            responseType: 'arraybuffer',
            validateStatus: () => true,
        }
    );

    const contentType = resp.headers['content-type'];

    if (contentType?.includes('application/json')) {
        const errorText = Buffer.from(resp.data).toString('utf8');
        console.error('Cloudflare image error:', errorText);
        throw new Error(`Image generation failed: ${errorText}`);
    }

    const base64 = Buffer.from(resp.data).toString('base64');
    return `data:image/png;base64,${base64}`;
}

// Google Gemini Image Generation (Imagen 3)
async function generateImageGemini(prompt, env) {
    const GEMINI_API_KEY = getEnv(env, 'GEMINI_API_KEY');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;

    const resp = await axios.post(
        url,
        {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                responseModalities: ['IMAGE'],
            },
        },
        {
            headers: {
                'Content-Type': 'application/json',
            },
            validateStatus: () => true,
        }
    );

    if (resp.status !== 200) {
        console.error('Gemini HTTP error:', resp.data);
        throw new Error(`Gemini request failed with status ${resp.status}`);
    }

    const parts = resp.data?.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p) => p.inlineData);

    if (!imagePart?.inlineData?.data) {
        console.error('Gemini response missing image:', resp.data);
        throw new Error('Gemini image generation failed: no image data returned');
    }

    const base64Image = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    return `data:${mimeType};base64,${base64Image}`;
}

export async function generateFreshName({ demographics, forbiddenNames }, env) {
    const forbiddenList = forbiddenNames
        .map((n) => n.trim())
        .filter(Boolean)
        .join(', ');

    const d = demographics;

    const prompt = `
You are picking a realistic first name for a fictional person experiencing homelessness.

Person details:
- Gender expression: ${d.genderExpression}
- Gender identity: ${d.genderIdentity}
- Race/ethnicity: ${d.raceEthnicity}

Rules:
- Return ONLY a single first name, nothing else.
- The name should be realistic for someone with these demographics.
- Do NOT return any of these names: ${forbiddenList || '[none]'}.
`.trim();

    const text = await generateText(prompt, { temperature: 0.7 }, env);
    const cleaned = sanitizeGeneratedFirstName(text);

    return cleaned || 'Alex';
}
