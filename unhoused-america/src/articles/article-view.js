import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { fetchRawArticleContent, parseArticleMarkdown } from './articles-data';
import './articles.css';

function parseUrlWithParens(text, startIdx) {
    if (startIdx >= text.length) return { url: '', nextIdx: -1 };

    // Support angle brackets syntax: [Label](<https://doi.org/10.1016/S0140-6736(08)61345-8>)
    if (text[startIdx] === '<') {
        const endAngle = text.indexOf('>', startIdx + 1);
        if (endAngle !== -1 && text[endAngle + 1] === ')') {
            return {
                url: text.slice(startIdx + 1, endAngle).trim(),
                nextIdx: endAngle + 2
            };
        }
    }

    // Track nested parenthesis depth: [Label](https://doi.org/10.1016/S0140-6736(08)61345-8)
    let depth = 1;
    let curr = startIdx;

    while (curr < text.length && depth > 0) {
        if (text[curr] === '(') depth++;
        else if (text[curr] === ')') depth--;
        if (depth > 0) curr++;
    }

    if (depth === 0) {
        return {
            url: text.slice(startIdx, curr).trim(),
            nextIdx: curr + 1
        };
    }

    return { url: '', nextIdx: -1 };
}

function renderInlineContent(text, onCitationClick) {
    if (!text) return text;

    const parts = [];
    let i = 0;

    while (i < text.length) {
        // Image: ![alt](url)
        if (text.startsWith('![', i)) {
            const endAlt = text.indexOf(']', i + 2);
            if (endAlt !== -1 && text[endAlt + 1] === '(') {
                const alt = text.slice(i + 2, endAlt);
                const { url, nextIdx } = parseUrlWithParens(text, endAlt + 2);
                if (nextIdx !== -1) {
                    parts.push(
                        <figure key={i} className="article-image-container">
                            <img src={url} alt={alt || 'Article image'} className="article-img" />
                            {alt && alt !== 'image' && <figcaption className="article-img-caption">{alt}</figcaption>}
                        </figure>
                    );
                    i = nextIdx;
                    continue;
                }
            }
        }

        // Footnote Citation: [^1]
        if (text.startsWith('[^', i)) {
            const endCite = text.indexOf(']', i + 2);
            if (endCite !== -1) {
                const num = text.slice(i + 2, endCite);
                parts.push(
                    <sup key={i} className="citation-ref">
                        <a
                            href={`#ref-${num}`}
                            id={`fnref-${num}`}
                            onClick={(e) => onCitationClick(e, num)}
                            title={`Jump to reference [${num}]`}
                        >
                            [{num}]
                        </a>
                    </sup>
                );
                i = endCite + 1;
                continue;
            }
        }

        // Markdown Link: [label](url)
        if (text[i] === '[' && (i === 0 || text[i - 1] !== '!')) {
            const endLabel = text.indexOf(']', i + 1);
            if (endLabel !== -1 && text[endLabel + 1] === '(') {
                const label = text.slice(i + 1, endLabel);
                const { url, nextIdx } = parseUrlWithParens(text, endLabel + 2);
                if (nextIdx !== -1) {
                    parts.push(
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            {label}
                        </a>
                    );
                    i = nextIdx;
                    continue;
                }
            }
        }

        // Accumulate standard text
        let nextSpecial = text.indexOf('[', i + 1);
        const nextImg = text.indexOf('![', i + 1);
        if (nextImg !== -1 && (nextSpecial === -1 || nextImg < nextSpecial)) {
            nextSpecial = nextImg;
        }

        if (nextSpecial === -1) {
            parts.push(text.slice(i));
            break;
        } else {
            parts.push(text.slice(i, nextSpecial));
            i = nextSpecial;
        }
    }

    return parts;
}

function renderMarkdownBlock(para, idx, onCitationClick) {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Check standalone image block: ![alt](url)
    if (trimmed.startsWith('![')) {
        const endAlt = trimmed.indexOf(']');
        if (endAlt !== -1 && trimmed[endAlt + 1] === '(') {
            const altText = trimmed.slice(2, endAlt);
            const { url, nextIdx } = parseUrlWithParens(trimmed, endAlt + 2);
            if (nextIdx === trimmed.length) {
                return (
                    <figure key={idx} className="article-image-container">
                        <img src={url} alt={altText || 'Article illustration'} className="article-img" />
                        {altText && altText !== 'image' && (
                            <figcaption className="article-img-caption">{altText}</figcaption>
                        )}
                    </figure>
                );
            }
        }
    }

    if (trimmed.startsWith('## ')) {
        const headingText = trimmed.replace(/^##\s*/, '');
        return <h2 key={idx}>{headingText}</h2>;
    }

    if (trimmed.startsWith('### ')) {
        const headingText = trimmed.replace(/^###\s*/, '');
        return <h3 key={idx}>{headingText}</h3>;
    }

    return <p key={idx}>{renderInlineContent(trimmed, onCitationClick)}</p>;
}

function parseMarkdownParagraphs(bodyText) {
    if (!bodyText) return { mainParagraphs: [], references: [] };

    const lines = bodyText.split('\n');
    const mainParagraphs = [];
    const references = [];
    let isReferencesSection = false;

    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('## References')) {
            isReferencesSection = true;
            return;
        }

        if (isReferencesSection || trimmed.startsWith('[^')) {
            const refMatch = trimmed.match(/^\[\^(\d+)\]\s*(.*)$/);
            if (refMatch) {
                references.push({
                    num: refMatch[1],
                    text: refMatch[2],
                });
            } else if (references.length > 0) {
                references[references.length - 1].text += ' ' + trimmed;
            }
        } else {
            mainParagraphs.push(trimmed);
        }
    });

    return { mainParagraphs, references };
}

function parseFormattedLinks(refText) {
    if (!refText) return refText;

    const parts = [];
    let i = 0;

    while (i < refText.length) {
        const openSquare = refText.indexOf('[', i);
        if (openSquare === -1) {
            parts.push(refText.slice(i));
            break;
        }

        if (openSquare > i) {
            parts.push(refText.slice(i, openSquare));
        }

        const closeSquare = refText.indexOf(']', openSquare + 1);
        if (closeSquare !== -1 && refText[closeSquare + 1] === '(') {
            const label = refText.slice(openSquare + 1, closeSquare);
            const { url, nextIdx } = parseUrlWithParens(refText, closeSquare + 2);

            if (nextIdx !== -1) {
                parts.push(
                    <a key={openSquare} href={url} target="_blank" rel="noopener noreferrer" className="ref-link-btn">
                        {label}
                    </a>
                );
                i = nextIdx;
                continue;
            }
        }

        if (closeSquare !== -1) {
            const label = refText.slice(openSquare + 1, closeSquare);
            parts.push(<span key={openSquare} className="ref-tag">[{label}]</span>);
            i = closeSquare + 1;
        } else {
            parts.push(refText.slice(openSquare));
            break;
        }
    }

    return parts;
}


function ArticleView() {
    const { filename } = useParams();
    const navigate = useNavigate();
    const [articleData, setArticleData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [highlightedRef, setHighlightedRef] = useState(null);
    const highlightTimerRef = useRef(null);

    useSEO({ title: articleData ? `${articleData.title} | Unhoused America` : 'Article | Unhoused America' });

    useEffect(() => {
        let isMounted = true;
        (async () => {
            setIsLoading(true);
            const rawContent = await fetchRawArticleContent(filename || '01-article');
            if (isMounted) {
                if (rawContent) {
                    const parsed = parseArticleMarkdown(rawContent);
                    setArticleData(parsed);
                } else {
                    setArticleData(null);
                }
                setIsLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [filename]);

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
            }
        };
    }, []);

    const handleCitationClick = (e, num) => {
        e.preventDefault();
        const targetElement = document.getElementById(`ref-${num}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setHighlightedRef(num);

            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
            }

            highlightTimerRef.current = setTimeout(() => {
                setHighlightedRef((current) => (current === num ? null : current));
            }, 2500);
        }
    };

    const handleBackToCitation = (e, num) => {
        e.preventDefault();
        const targetElement = document.getElementById(`fnref-${num}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    if (isLoading) {
        return (
            <div className="main-content embodicons lightbg">
                <div style={{ padding: '60px', color: 'var(--primary-purple)', fontSize: '1.2em', textAlign: 'center' }}>
                    Loading article...
                </div>
            </div>
        );
    }

    if (!articleData) {
        return (
            <div className="main-content embodicons lightbg">
                <div style={{ padding: '60px', color: 'var(--primary-purple)', fontSize: '1.2em', textAlign: 'center' }}>
                    <h2>Article Not Found</h2>
                    <p>The requested article could not be loaded.</p>
                    <button className="back-button" style={{ position: 'static', marginTop: '1rem' }} onClick={() => navigate('/')}>
                        ← Back Home
                    </button>
                </div>
            </div>
        );
    }

    const { mainParagraphs, references } = parseMarkdownParagraphs(articleData.body);

    return (
        <div className="main-content embodicons lightbg article-page">
            <div className="article-circle-bg" aria-hidden="true" />

            <div className="article-container">
                <button className="back-button" href="/articles" onClick={() => navigate('/articles')}>
                    ← Back to Articles
                </button>
                
                <header className="article-header">
                    <h1 className="article-title">{articleData.title}</h1>

                    {articleData.authors && articleData.authors.length > 0 && (
                        <div className="article-authors">
                            {articleData.authors.map((author, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && ', '}
                                    {author.link ? (
                                        <a href={author.link} target="_blank" rel="noopener noreferrer" className="article-author-link">
                                            {author.name}
                                        </a>
                                    ) : (
                                        <span>{author.name}</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {articleData.abstract && (
                        <div className="article-abstract-box">
                            <p className="article-abstract-text">{articleData.abstract}</p>
                        </div>
                    )}

                    {articleData.keywords && articleData.keywords.length > 0 && (
                        <div className="article-keywords">
                            Keywords: 
                            {articleData.keywords.map((kw, idx) => (
                                <span key={idx} className="article-keyword-chip">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                <main className="article-body-content">
                    <div className="article-body-text">
                        {mainParagraphs.map((para, idx) => renderMarkdownBlock(para, idx, handleCitationClick))}

                    </div>

                    {references.length > 0 && (
                        <div className="article-references-section">
                            <h2>References</h2>
                            {references.map((ref) => {
                                const isHighlighted = highlightedRef === ref.num;
                                return (
                                    <div
                                        key={ref.num}
                                        id={`ref-${ref.num}`}
                                        className={`article-reference-item ${isHighlighted ? 'highlighted' : ''}`}
                                    >
                                        <a
                                            href={`#fnref-${ref.num}`}
                                            onClick={(e) => handleBackToCitation(e, ref.num)}
                                            title="Back to text"
                                            className="ref-back-link"
                                        >
                                            <strong>[{ref.num}]</strong>
                                        </a> 
                                        {parseFormattedLinks(ref.text)}{' '}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default ArticleView;

