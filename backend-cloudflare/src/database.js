// Cloudflare D1 database operations


export async function createPersona({ city, demographics, name, age, narrative, imageUrl }, env) {
    const stmt = env.DB.prepare(`
		INSERT INTO personas (city, demographics_json, name, age, narrative, image_url)
		VALUES (?, ?, ?, ?, ?, ?)
	`);

    const result = await stmt
        .bind(city, JSON.stringify(demographics), name, age, narrative, imageUrl)
        .run();

    return result.meta.last_row_id;
}

export async function getRawPersona(id, env) {
    const stmt = env.DB.prepare(`
		SELECT * FROM personas WHERE id = ?
	`);

    const result = await stmt.bind(id).first();
    return result || null;
}

export async function getPersona(id, baseUrl, env) {
    const stmt = env.DB.prepare(`
		SELECT * FROM personas WHERE id = ?
	`);

    const result = await stmt.bind(id).first();
    if (!result) return null;

    // Transform image_url to use the caching proxy endpoint if it exists
    if (result.image_url && baseUrl) {
        result.image_url = `${baseUrl}/api/personas/${id}/image`;
    }
    return result;
}

export async function listPersonas(limit = 50, baseUrl, env) {
    const stmt = env.DB.prepare(`
        SELECT id, created_at, city, name, age, image_url, demographics_json 
        FROM personas 
		ORDER BY id DESC 
		LIMIT ?
	`);

    const result = await stmt.bind(limit).all();
    const personas = result.results || [];

    // Transform image_url to use the caching proxy endpoint if it exists
    return personas.map(p => ({
        ...p,
        image_url: p.image_url && baseUrl ? `${baseUrl}/api/personas/${p.id}/image` : ''
    }));
}

export async function listPersonasPaginated({ page = 1, limit = 12, filters = {} }, baseUrl, env) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 12));
    const offset = (safePage - 1) * safeLimit;

    const whereClauses = [];
    const whereParams = [];

    const addMultiValueFilter = (values, expression, transform = (v) => v) => {
        if (!Array.isArray(values) || values.length === 0) return;
        const validValues = values.map((v) => String(v || '').trim()).filter(Boolean);
        if (!validValues.length) return;

        const orClauses = validValues.map(() => `${expression} LIKE ?`);
        whereClauses.push(`(${orClauses.join(' OR ')})`);
        validValues.forEach((v) => {
            whereParams.push(`%${String(transform(v)).toLowerCase()}%`);
        });
    };

    addMultiValueFilter(
        filters.city,
        `LOWER(COALESCE(city, ''))`,
        (v) => v.split(',')[0].trim()
    );

    addMultiValueFilter(
        filters.presentation,
        `LOWER(COALESCE(json_extract(demographics_json, '$.genderExpression'), ''))`
    );

    addMultiValueFilter(
        filters.gender,
        `LOWER(COALESCE(json_extract(demographics_json, '$.genderIdentity'), ''))`
    );

    addMultiValueFilter(
        filters.race,
        `LOWER(COALESCE(json_extract(demographics_json, '$.raceEthnicity'), ''))`
    );

    addMultiValueFilter(
        filters.orientation,
        `LOWER(COALESCE(json_extract(demographics_json, '$.sexualOrientation'), ''))`
    );

    addMultiValueFilter(
        filters.maritalStatus,
        `LOWER(COALESCE(json_extract(demographics_json, '$.relationshipStatus'), ''))`
    );

    addMultiValueFilter(
        filters.dependents,
        `LOWER(COALESCE(json_extract(demographics_json, '$.parentStatus'), ''))`
    );

    addMultiValueFilter(
        filters.age,
        `LOWER(COALESCE(json_extract(demographics_json, '$.ageRange'), ''))`
    );

    addMultiValueFilter(
        filters.education,
        `LOWER(COALESCE(json_extract(demographics_json, '$.education'), ''))`
    );

    addMultiValueFilter(
        filters.disabilities,
        `LOWER(COALESCE(json_extract(demographics_json, '$.disabilityStatus'), ''))`
    );

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countStmt = env.DB.prepare(`
        SELECT COUNT(*) as total 
        FROM personas
        ${whereSQL}
    `);

    const countResult = await countStmt.bind(...whereParams).first();
    const total = Number(countResult?.total || 0);
    const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;

    const dataStmt = env.DB.prepare(`
        SELECT id, created_at, city, name, age, image_url, demographics_json
        FROM personas
        ${whereSQL}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `);

    const dataResult = await dataStmt.bind(...whereParams, safeLimit, offset).all();
    const personas = (dataResult.results || []).map((p) => ({
        ...p,
        image_url: p.image_url && baseUrl ? `${baseUrl}/api/personas/${p.id}/image` : '',
    }));

    return {
        items: personas,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
    };
}

export async function clearCityChunks(env) {
    const stmt = env.DB.prepare(`DELETE FROM city_chunks`);
    await stmt.run();
}

export async function insertCityChunk({ city, chunkIndex, text, embedding }, env) {
    const stmt = env.DB.prepare(`
		INSERT INTO city_chunks (city, chunk_index, text, embedding_json) 
		VALUES (?, ?, ?, ?)
	`);

    const result = await stmt
        .bind(city.toLowerCase(), chunkIndex, text, JSON.stringify(embedding))
        .run();

    return result.meta.last_row_id;
}

export async function getCityChunks(city, env) {
    const stmt = env.DB.prepare(`
		SELECT chunk_index, text, embedding_json 
		FROM city_chunks 
		WHERE city = ? 
		ORDER BY chunk_index ASC
	`);

    const result = await stmt.bind(city.toLowerCase()).all();

    return (result.results || []).map((r) => ({
        index: r.chunk_index,
        text: r.text,
        embedding: JSON.parse(r.embedding_json),
    }));
}

export async function getLastNames(limit = 10, env) {
    const stmt = env.DB.prepare(`
		SELECT name 
		FROM personas
		WHERE name IS NOT NULL AND name != ''
		ORDER BY id DESC
		LIMIT ?
	`);

    const result = await stmt.bind(limit).all();
    return (result.results || []).map((r) => r.name);
}

export async function getLastNamesForCombo(raceEthnicity, genderExpression, limit = 10, env) {
    const stmt = env.DB.prepare(`
		SELECT name, demographics_json
		FROM personas
		WHERE name IS NOT NULL AND name != ''
		ORDER BY id DESC
		LIMIT 100
	`);

    const result = await stmt.all();
    const rows = result.results || [];

    // Filter in-memory (same as original logic)
    const matches = rows
        .map((r) => {
            try {
                const d = JSON.parse(r.demographics_json || '{}');
                if (
                    d.raceEthnicity === raceEthnicity &&
                    d.genderExpression === genderExpression
                ) {
                    return r.name;
                }
            } catch {
                // skip
            }
            return null;
        })
        .filter(Boolean)
        .slice(0, limit);

    return matches;
}
