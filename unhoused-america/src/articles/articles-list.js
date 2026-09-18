import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { getAllArticleSlugs, fetchRawArticleContent, parseArticleMarkdown } from './articles-data';
import './articles.css';

function ArticlesList() {
    useSEO({ title: 'Articles | Unhoused America' });
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            const slugs = getAllArticleSlugs();
            const list = await Promise.all(
                slugs.map(async (slug) => {
                    const raw = await fetchRawArticleContent(slug);
                    if (raw) {
                        const parsed = parseArticleMarkdown(raw);
                        return { slug, ...parsed };
                    }
                    return { slug, title: slug, authors: [], abstract: '', keywords: [] };
                })
            );

            if (isMounted) {
                setArticles(list.filter(Boolean));
                setIsLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="main-content embodicons lightbg article-page">
            <div className="article-header-nav">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← Back Home
                </button>
            </div>

            <div className="articles-list-container">
                <h1 style={{ fontFamily: 'var(--averia-font)', color: 'var(--primary-purple)' }}>Articles & Research</h1>
                <p style={{ fontFamily: 'var(--quattrocento-font)', color: 'var(--primary-purple)', fontSize: '1.1rem' }}>
                    Explore research articles and academic publications on housing instability, mental health, and policy solutions.
                </p>

                {isLoading ? (
                    <p style={{ color: 'var(--primary-purple)' }}>Loading articles...</p>
                ) : (
                    <div className="articles-grid">
                        {articles.map((art) => (
                            <div
                                key={art.slug}
                                className="article-card"
                                onClick={() => navigate(`/article/${art.slug}`)}
                            >
                                <h2>{art.title}</h2>
                                {art.authors.length > 0 && (
                                    <div className="article-card-authors">
                                        By {art.authors.map(a => a.name).join(', ')}
                                    </div>
                                )}
                                {art.abstract && <div className="article-card-abstract">{art.abstract}</div>}
                                {art.keywords.length > 0 && (
                                    <div className="article-keywords">
                                        {art.keywords.map((kw, idx) => (
                                            <span key={idx} className="article-keyword-chip">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ArticlesList;
