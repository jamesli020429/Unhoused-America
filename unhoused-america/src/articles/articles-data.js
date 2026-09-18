// src/articles/articles-data.js

// Automatically discover all .md files inside article-archive/ at build time
const markdownContext = require.context('./article-archive', false, /\.md$/);

export function getAllArticleSlugs() {
    return markdownContext.keys().map(key => key.replace(/^\.\//, '').replace(/\.md$/, ''));
}

export function parseArticleMarkdown(content) {
    let frontmatter = {};
    let body = content;

    const match = content.match(/^---([\s\S]+?)---([\s\S]*)$/);
    if (match) {
        body = match[2].trim();
        match[1].split('\n').forEach(line => {
            const colonIdx = line.indexOf(':');
            if (colonIdx !== -1) {
                const key = line.slice(0, colonIdx).trim().replace(/^"|"$/g, '');
                const val = line.slice(colonIdx + 1).trim().replace(/^"|"$/g, '');
                frontmatter[key] = val;
            }
        });
    }

    const authorsStr = frontmatter['Authors'] || frontmatter['authors'] || '';
    const linksStr = frontmatter['Author Links'] || frontmatter['author_links'] || '';
    const authors = authorsStr.split(',').map(s => s.trim()).filter(Boolean);
    const links = linksStr.split(',').map(s => s.trim()).filter(Boolean);

    return {
        title: frontmatter['Title'] || frontmatter['title'] || 'Untitled Article',
        authors: authors.map((name, idx) => ({ name, link: links[idx] || null })),
        abstract: frontmatter['Abstract'] || frontmatter['abstract'] || '',
        keywords: (frontmatter['Keywords'] || '').split(',').map(s => s.trim()).filter(Boolean),
        body
    };
}

export async function fetchRawArticleContent(slug) {
    const cleanSlug = String(slug || '').replace(/\.md$/i, '').trim();
    const relativePath = `./${cleanSlug}.md`;

    try {
        const assetUrl = markdownContext(relativePath);
        const res = await fetch(assetUrl);
        if (res.ok) {
            return await res.text();
        }
    } catch (e) {
        console.warn(`Article asset not found for slug "${cleanSlug}":`, e);
    }

    return null;
}
