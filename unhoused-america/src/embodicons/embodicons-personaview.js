import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CITY_RESOURCES } from './city-resources';
import { useSEO } from '../hooks/useSEO';
import './embodicons.css';

function getResourceCityKey(city) {
    const raw = String(city || '').trim();
    const normalized = raw.toLowerCase().replace(/[.,]/g, '');

    const aliases = {
        'los angeles': 'la',
        la: 'la',
        'new york': 'nyc',
        nyc: 'nyc',
        'washington dc': 'dc',
        washington: 'dc',
        dc: 'dc',
        atlanta: 'atlanta',
        boston: 'boston',
        portland: 'portland',
    };

    return aliases[normalized] || normalized;
}

function getCityMapImage(city) {
    const key = getResourceCityKey(city);
    const mapImages = {
        atlanta: '/embodicons/atlanta.svg',
        boston: '/embodicons/boston.svg',
        la: '/embodicons/la.svg',
        nyc: '/embodicons/nyc.svg',
        portland: '/embodicons/portland.svg',
        dc: '/embodicons/dc.svg',
    };
    return mapImages[key] || null;
}

function getDemographicChips(persona) {
    if (!persona) return [];

    let d = persona.demographics || {};
    if (typeof d === 'string') {
        try {
            d = JSON.parse(d);
        } catch (e) {
            d = {};
        }
    }

    const chips = [];

    if (persona.city) {
        chips.push(persona.city);
    }

    // Note: Age is intentionally excluded from demographic chips

    if (d.genderExpression) {
        chips.push(d.genderExpression);
    }
    if (d.genderIdentity && d.genderIdentity !== d.genderExpression) {
        chips.push(d.genderIdentity);
    }
    if (d.raceEthnicity) {
        chips.push(d.raceEthnicity);
    }
    if (d.sexualOrientation) {
        chips.push(d.sexualOrientation);
    }
    if (d.relationshipStatus) {
        chips.push(d.relationshipStatus);
    }
    if (d.parentStatus) {
        const text = d.parentStatus === "no dependent children" ? "No dependent children" : d.parentStatus;
        chips.push(text);
    }
    if (d.education) {
        chips.push(d.education);
    }
    if (d.disabilityStatus && d.disabilityStatus !== "None") {
        chips.push(d.disabilityStatus);
    }

    return [...new Set(chips)];
}

function EmbodiconsPersonaView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [persona, setPersona] = useState(null);
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8787';

    useSEO({ title: persona ? `${persona.name} | Embodicons` : 'Embodicons' });

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/personas/${id}`);
                const data = await res.json();
                if (res.ok) setPersona(data);
            } catch (err) {
                console.error('Failed to load persona:', err);
            }
        })();
    }, [id, API_BASE]);

    if (!persona) {
        return (
            <div className='main-content embodicons lightbg'>
                <div style={{ padding: '60px', color: 'var(--primary-purple)', fontSize: '1.2em', textAlign: 'center' }}>
                    Loading persona...
                </div>
            </div>
        );
    }

    const cityKey = getResourceCityKey(persona.city);
    const mapImage = getCityMapImage(persona.city);
    const resources = CITY_RESOURCES[cityKey] || [];
    const chips = getDemographicChips(persona);

    return (
        <div className='main-content embodicons lightbg persona-view-page'>

            <div className='embodicons-profile persona-view-card'>
                {mapImage && (
                    <div
                        className="persona-bg-map"
                        style={{
                            WebkitMaskImage: `url(${mapImage})`,
                            maskImage: `url(${mapImage})`
                        }}
                        aria-hidden="true"
                    />
                )}

                <div className='embodicons-profile-title-mobile'>
                    <h1><span class="embodicons-profile-title-small">Meet</span>{persona.name}{persona.age ? `, ${persona.age}` : ''}</h1>
                    {persona.image_url && (
                        <div className="persona-image-container-mobile">
                            <img src={persona.image_url} alt={persona.name} />
                        </div>
                    )}
                </div>


                <div className='embodicons-profile-left persona-details-side'>
                    <h1 className='embodicons-profile-title-desktop'><span class="embodicons-profile-title-small">Meet</span>{persona.name}{persona.age ? `, ${persona.age}` : ''}</h1>

                    <div className="persona-narrative-text">
                        <p>{persona.narrative}</p>
                    </div>

                    <div className="persona-action-buttons">
                        <button
                            className="persona-action-btn primary"
                            onClick={() => navigate('/embodicons?form=true', { state: { startForm: true } })}
                        >
                            Create a new Embodicon
                        </button>
                        <button
                            className="persona-action-btn secondary"
                            onClick={() => navigate('/embodicons/all')}
                        >
                            See all Embodicons
                        </button>
                    </div>

                </div>

                <div className='embodicons-profile-right persona-image-side'>
                    {persona.image_url && (
                        <div className="persona-image-container-desktop">
                            <img src={persona.image_url} alt={persona.name} />
                        </div>
                    )}

                    {chips.length > 0 && (
                        <div className="persona-chips-container" aria-label="Demographics">
                            {chips.map((chip, index) => (
                                <span key={index} className="persona-chip">
                                    {chip}
                                </span>
                            ))}
                        </div>
                    )}

                </div>
            </div>

            {resources.length > 0 && (
                <section className="persona-resources-section">
                    <h2>Resources in {persona.city}</h2>
                    <div className="resources-grid">
                        {resources.map((r) => (
                            <div className="resource-card" key={r.name}>
                                <a href={r.url} target="_blank" rel="noopener noreferrer">
                                    {r.img && (
                                        <div
                                            className="resource-card-image"
                                            role="img"
                                            aria-label={r.name}
                                            style={{ backgroundImage: `url(${r.img})` }}
                                        />
                                    )}
                                    <div>{r.name}</div>
                                </a>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default EmbodiconsPersonaView;