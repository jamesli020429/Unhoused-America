import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import './embodicons.css';

// Demographics filter options based on embodicons-form.js
const FILTER_OPTIONS = {
    city: [
        'Atlanta, GA',
        'Boston, MA',
        'Los Angeles, CA',
        'New York, NY',
        'Portland, OR',
        'Washington, DC'
    ],
    presentation: ['Masculine', 'Feminine', 'Androgynous'],
    gender: ['Cisgender', 'Transgender', 'Non-binary', 'Other'],
    race: [
        'White',
        'Hispanic/Latino',
        'Black/African American',
        'Asian',
        'Middle Eastern',
        'American Indian and Alaska Native',
        'Native Hawaiian and Other Pacific Islander'
    ],
    orientation: [
        'Asexual',
        'Bisexual',
        'Heterosexual',
        'Gay',
        'Lesbian',
        'Pansexual',
        'Queer',
        'Other'
    ],
    maritalStatus: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Other'],
    dependents: ['0', '1', '2', '3+'],
    age: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    education: [
        '12th grade or less',
        'High school diploma or equivalent',
        'Some college',
        'Associate degree',
        "Bachelor's degree",
        'Graduate or professional degree'
    ],
    disabilities: [
        'Physical disability',
        'Mental/psychological disability',
        'Sensory disability',
        'Cognitive/intellectual disability',
        'Addiction',
        'HIV/AIDS',
        'Other',
        'None'
    ]
};

function EmbodiconsAll() {
    useSEO({ title: 'Embodicons' });
    const [displayedPersonas, setDisplayedPersonas] = useState([]);
    const [pendingPersonas, setPendingPersonas] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        city: [],
        presentation: [],
        gender: [],
        race: [],
        orientation: [],
        maritalStatus: [],
        dependents: [],
        age: [],
        education: [],
        disabilities: []
    });
    const [expandedFilters, setExpandedFilters] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [cardTransitionStage, setCardTransitionStage] = useState('idle');
    const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
    const hasHydratedCardsRef = useRef(false);
    const transitionTimerRef = useRef(null);
    const navigate = useNavigate();
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8787';
    const PERSONAS_PER_PAGE = 12;
    const CARD_FADE_MS = 220;

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 768px)');

        const syncFiltersPanelState = (event) => {
            setIsFiltersPanelOpen(!event.matches);
        };

        // Initial load: collapsed on mobile, open on desktop
        syncFiltersPanelState(mediaQuery);

        mediaQuery.addEventListener('change', syncFiltersPanelState);
        return () => mediaQuery.removeEventListener('change', syncFiltersPanelState);
    }, []);

    useEffect(() => {
        return () => {
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current);
            }
        };
    }, []);

    // Stage-based transition flow:
    // 1) fade out current cards
    // 2) swap dataset after fade-out
    // 3) render swapped cards at opacity 0
    // 4) fade new cards in
    useEffect(() => {
        if (cardTransitionStage !== 'fading-out') return;

        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => {
            const next = pendingPersonas || [];
            setDisplayedPersonas(next);
            setPendingPersonas(null);
            setCardTransitionStage('pre-fade-in');

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setCardTransitionStage('fading-in');
                });
            });
        }, CARD_FADE_MS);
    }, [cardTransitionStage, pendingPersonas]);

    useEffect(() => {
        if (cardTransitionStage !== 'fading-in') return;

        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => {
            setCardTransitionStage('idle');
        }, CARD_FADE_MS);
    }, [cardTransitionStage]);

    // Fetch personas with server-side pagination + filters
    useEffect(() => {
        let isCancelled = false;

        (async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('page', String(currentPage));
                params.set('limit', String(PERSONAS_PER_PAGE));

                Object.entries(filters).forEach(([category, selectedValues]) => {
                    selectedValues.forEach((value) => params.append(category, value));
                });

                const res = await fetch(`${API_BASE}/api/personas?${params.toString()}`);
                const data = await res.json();
                if (!isCancelled && res.ok) {
                    const nextPersonas = Array.isArray(data.items) ? data.items : [];

                    if (!hasHydratedCardsRef.current) {
                        hasHydratedCardsRef.current = true;
                        setDisplayedPersonas(nextPersonas);
                        setCardTransitionStage('pre-fade-in');
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                setCardTransitionStage('fading-in');
                            });
                        });
                    } else if (displayedPersonas.length === 0) {
                        setDisplayedPersonas(nextPersonas);
                        setCardTransitionStage('pre-fade-in');
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                setCardTransitionStage('fading-in');
                            });
                        });
                    } else {
                        setPendingPersonas(nextPersonas);
                        setCardTransitionStage('fading-out');
                    }

                    setTotalCount(Number(data.total || 0));
                    setTotalPages(Number(data.totalPages || 0));
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('Error fetching personas:', error);
                    setPendingPersonas([]);
                    if (displayedPersonas.length > 0) {
                        setCardTransitionStage('fading-out');
                    } else {
                        setDisplayedPersonas([]);
                    }
                    setTotalCount(0);
                    setTotalPages(0);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [API_BASE, currentPage, filters]);

    // Toggle filter category
    const toggleFilterCategory = (category) => {
        setExpandedFilters(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Toggle filter value
    const toggleFilter = (category, value) => {
        setCurrentPage(1);
        setFilters(prev => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter(v => v !== value)
                : [...prev[category], value]
        }));
    };

    // Clear all filters
    const clearAllFilters = () => {
        setCurrentPage(1);
        setFilters({
            city: [],
            presentation: [],
            gender: [],
            race: [],
            orientation: [],
            maritalStatus: [],
            dependents: [],
            age: [],
            education: [],
            disabilities: []
        });
    };

    const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <div className="main-content embodicons embodicons-all">
            <div className="embodicons-all-header">
                <button className="back-button" onClick={() => navigate('/embodicons')}>
                    ← Back
                </button>
                <h1>All Embodicons</h1>
            </div>

            <div className="embodicons-all-container">
                {/* Filters Sidebar */}
                <div className={`embodicons-filters-sidebar ${isFiltersPanelOpen ? 'open' : 'collapsed'}`}>
                    <div className="filters-header">
                        <button
                            type="button"
                            className="filters-title-button"
                            onClick={() => setIsFiltersPanelOpen((prev) => !prev)}
                            aria-expanded={isFiltersPanelOpen}
                        >
                            <span>Filters</span>
                            <span className="filters-title-icon">{isFiltersPanelOpen ? '▼' : '▶'}</span>
                        </button>
                        {activeFilterCount > 0 && (
                            <button className="clear-filters-btn" onClick={clearAllFilters}>
                                Clear All ({activeFilterCount})
                            </button>
                        )}
                    </div>

                    <div className="filters-list">
                        {Object.keys(FILTER_OPTIONS).map(category => (
                            <div key={category} className="filter-category">
                                <button
                                    className="filter-category-header"
                                    onClick={() => toggleFilterCategory(category)}
                                >
                                    <span>
                                        {category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}
                                    </span>
                                    <span className="expand-icon">
                                        {expandedFilters[category] ? '▼' : '▶'}
                                    </span>
                                </button>

                                {expandedFilters[category] && (
                                    <div className="filter-options">
                                        {FILTER_OPTIONS[category].map(option => (
                                            <label key={option} className="filter-option">
                                                <input
                                                    type="checkbox"
                                                    checked={filters[category].includes(option)}
                                                    onChange={() => toggleFilter(category, option)}
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Personas Grid */}
                <div className="embodicons-all-content">
                    <div className="embodicons-all-content-inner">
                        <div className="personas-info">
                            <p>Showing {totalCount} persona{totalCount !== 1 ? 's' : ''}</p>
                        </div>

                        {displayedPersonas.length === 0 && !isLoading ? (
                        <div className="no-results">
                            <p>No personas match your filters.</p>
                            <button onClick={clearAllFilters}>Clear filters</button>
                        </div>
                        ) : (
                            <>
                            <div className={`persona-grid large persona-grid-transition ${cardTransitionStage}`}>
                                {displayedPersonas.map((p) => (
                                    <div
                                        key={p.id}
                                        className="persona-card"
                                        onClick={() => navigate(`/embodicons/persona/${p.id}`)}
                                    >
                                        {p.image_url && <img src={p.image_url} alt={p.name} />}
                                        <div><b>{p.name || 'Unnamed'}</b>{p.age && <span>, {p.age}</span>}</div>
                                        <span className="persona-city">{p.city}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalCount > PERSONAS_PER_PAGE && totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>

                                    <div className="page-numbers">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                className={page === currentPage ? 'active' : ''}
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default EmbodiconsAll;
