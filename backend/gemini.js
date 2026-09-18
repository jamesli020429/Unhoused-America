// backend/gemini.js
import 'dotenv/config';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

// SDXL model hosted by Cloudflare
// const MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';

// Base URL for the Generative Language API (v1beta)
// const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Text/story generation using Llama 3.1 Instruct hosted by Cloudflare
export async function generateText(prompt, { temperature = 0.6 } = {}) {
    const MODEL = '@cf/meta/llama-3.1-8b-instruct';
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const resp = await axios.post(
        url,
        {
            messages: [{ role: 'user', content: prompt }],
            temperature,
            top_p: 0.9,
            max_tokens: 600
        },
        {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!resp.data?.result?.response) {
        console.error('Text generation error:', resp.data);
        throw new Error('Failed to generate text');
    }

    return resp.data.result.response;
}

// embeddings
// cloudflareEmbeddings.js
export async function embedText(text) {
    const MODEL = '@cf/baai/bge-base-en-v1.5';
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const resp = await axios.post(
        url,
        { text },
        {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!resp.data?.result?.data?.[0]) {
        console.error('Embedding error:', resp.data);
        throw new Error('Failed to generate embedding');
    }

    return resp.data.result.data[0];
}

// ---- Image prompt helper ----

export async function extractVisualDetails({
    name,
    age,
    demographics,
    narrative }) {
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

    const jsonText = await generateText(prompt, { temperature: 0.2 });
    return JSON.parse(jsonText);
}

export function buildImagePromptFromVisuals(visuals, city, demographics, imageLocation) {
    return `
   A documentary photograph in 9:16 format (portrait) taken in a real-world environment.
Photographed by a human photographer using a full-frame DSLR camera.
Eye-level angle, camera placed several feet away from the subject.
Wide framing, ${visuals.appearance || `a ${demographics.genderExpression} person, medium build, ${demographics.age} years old`} in center and directly looking at camera, body visible above the waist, not full body, occupies more than 70% but less than 90% of the frame, relaxed posture, neutral expression, ${visuals.clothing || 'casual clothing'}. No portrait crop.

The person is in a ${imageLocation} in ${city}. This is visible in the background. Deep depth of field: both the subject and the environment are clearly in focus.

Natural ambient lighting from the environment.
No studio lighting, no backdrop, no controlled setup.
`.trim();


}

// Image Generation
export async function generateImage(prompt, { model = 'cloudflare' } = {}) {
    if (!prompt || !prompt.trim()) {
        throw new Error('Empty prompt passed to generateImage');
    }

    if (model === 'gemini') {
        return await generateImageGemini(prompt);
    }

    // Default: Cloudflare Stable Diffusion
    const MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const resp = await axios.post(
        url,
        {
            prompt,
            // ⚠️ Keep these conservative
            width: 1024,
            height: 512,
            num_steps: 20,
            guidance_scale: 7,
            negative_prompt: `studio portrait, headshot, cropped face, profile view, side view, looking away, illustration, painting, digital art, blurred background, shallow depth of field, airbrushed skin, perfect symmetry, concept art, unreal, fake, environment not in ${prompt}, environment only, no person, face not visible, multiple people, text, watermarks, distorted faces, distorted proportions, distorted body parts`
        },
        {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            validateStatus: () => true
        }
    );

    const contentType = resp.headers['content-type'];

    // 🚨 Cloudflare error = JSON, not image
    if (contentType?.includes('application/json')) {
        const errorText = Buffer.from(resp.data).toString('utf8');
        console.error('Cloudflare image error:', errorText);
        throw new Error(`Image generation failed: ${errorText}`);
    }

    // ✅ Raw PNG bytes
    const base64 = Buffer.from(resp.data).toString('base64');
    return `data: image / png; base64, ${base64} `;
}

// Google Gemini Image Generation (Imagen 3)
async function generateImageGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const resp = await axios.post(
        url,
        {
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                responseModalities: ["IMAGE"]
            }
        },
        {
            headers: {
                "Content-Type": "application/json"
            },
            validateStatus: () => true
        }
    );

    if (resp.status !== 200) {
        console.error("Gemini HTTP error:", resp.data);
        throw new Error(`Gemini request failed with status ${resp.status}`);
    }

    const parts = resp.data?.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find(p => p.inlineData);

    if (!imagePart?.inlineData?.data) {
        console.error("Gemini response missing image:", resp.data);
        throw new Error("Gemini image generation failed: no image data returned");
    }

    const base64Image = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";

    return `data:${mimeType};base64,${base64Image}`;
}



// generate a fresh first name not in forbiddenNames
export async function generateFreshName({ demographics, forbiddenNames }) {
    const MODEL = "@cf/meta/llama-3.1-8b-instruct";
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const forbiddenList = forbiddenNames
        .map(n => n.trim())
        .filter(Boolean)
        .join(", ");

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
- Do NOT return any of these names: ${forbiddenList || "[none]"}.
`.trim();

    const resp = await axios.post(
        url,
        {
            prompt,
            temperature: 0.7,
            top_k: 40,
            top_p: 0.9
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                "Content-Type": "application/json"
            },
            validateStatus: () => true
        }
    );

    if (!resp.data?.success) {
        console.error("Cloudflare AI error:", resp.data);
        throw new Error(resp.data?.errors?.[0]?.message || "Cloudflare AI failed");
    }

    let text = resp.data.result?.response || "";
    text = text.trim();

    // Cleanup in case model disobeys
    text = text.replace(/^Name:\s*/i, "");
    text = text.replace(/^\[?([A-Za-z\-']+)\]?\s*$/, "$1");

    return text || "Alex";
}
