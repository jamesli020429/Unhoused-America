import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './embodicons.css';

const CITY_REFERENCES = [
    {
        city: 'Atlanta, GA',
        items: [
            {
                title: '“2024 Point-in-Time Count.”',
                source: 'Partners for HOME, 2024.',
                url: 'https://partnersforhome.org/wp-content/uploads/2020/07/PfH_PIT2024-2.pdf'
            },
            {
                title: '“Homelessness Assistance.”',
                source: 'Georgia Department of Community Affairs.',
                url: 'https://dca.georgia.gov/affordable-housing/homelessness-assistance'
            },
            {
                title: '“Hope Atlanta.”',
                source: 'HOPE Atlanta.',
                url: 'https://hopeatlanta.org/'
            },
            {
                title: '“The State of Homelessness in Atlanta: 2024 Insights.”',
                source: 'Atlanta Mission.',
                url: 'https://atlantamission.org/the-state-of-homelessness-in-atlanta-2024-insights/'
            },
            {
                title: '“Understanding the Problem.”',
                source: 'Atlanta Mission.',
                url: 'https://atlantamission.org/understanding-the-problem/'
            }
        ]
    },
    {
        city: 'Boston, MA',
        items: [
            {
                title: '“2025 Annual Homeless Census Preliminary Findings Brief Memo.”',
                source: "Boston Mayor's Office of Housing, 8 May 2025.",
                url: 'https://docs.google.com/document/d/1X8FEAfIKdYPQtQMv74M_5fBlEQDn1WUuYx4CviQREZI/edit?tab=t.0'
            },
            {
                title: '“Annual Homeless Census.”',
                source: 'City of Boston.',
                url: 'https://www.boston.gov/departments/housing/annual-homeless-census'
            },
            {
                title: 'Kennedy, Aja, and Luc Schuster. “Homelessness in Greater Boston: An Update.”',
                source: 'Boston Indicators, 29 Jan. 2025.',
                url: 'https://www.bostonindicators.org/article-pages/2025/january/homelessness-point-in-time-update'
            },
            {
                title: 'McConville, Christine. “Massachusetts\' Housing Crisis Is Fueling Homelessness.”',
                source: 'The Boston Globe, 3 Nov. 2024.',
                url: 'https://www.bostonglobe.com/2024/11/03/business/boston-massachusetts-section-8-shelter-migrants-housing-homeless'
            }
        ]
    },
    {
        city: 'Los Angeles, CA',
        items: [
            {
                title: '“2024 Greater Los Angeles Homeless Count Results.”',
                source: 'Los Angeles Homeless Services Authority, 2024.',
                url: 'https://www.lahsa.org/documents?id=8164-2024-greater-los-angeles-homeless-count-results-long-version-.pdf'
            },
            {
                title: '“Forward Momentum with 2024 Homeless Count.”',
                source: 'Los Angeles County Homeless Initiative, 2024.',
                url: 'https://homeless.lacounty.gov/news/forward-momentum-with-2024-homeless-count/'
            },
            {
                title: '“Why Is Homelessness Worse in LA?”',
                source: 'Better Angels.',
                url: 'https://www.betterangels.la/halo/get-answers/why-is-homelessness-worse-in-la'
            }
        ]
    },
    {
        city: 'New York, NY',
        items: [
            {
                title: '“Basic Facts About Homelessness: New York City.”',
                source: 'Coalition for the Homeless.',
                url: 'https://www.coalitionforthehomeless.org/basic-facts-about-homelessness-new-york-city/'
            },
            {
                title: '“Homelessness Dashboard.”',
                source: 'New York City Council.',
                url: 'https://council.nyc.gov/data/homeless'
            },
            {
                title: '“DiNapoli: Numbers of Homeless Population Doubled in New York.”',
                source: 'Office of the New York State Comptroller, Jan. 2025.',
                url: 'https://www.osc.ny.gov/press/releases/2025/01/dinapoli-numbers-homeless-population-doubled-new-york'
            },
            {
                title: '“The Network\'s Statement on the Upcoming 2025 Point-in-Time Count and the 2024 United States Department of Housing and Urban Development Findings.”',
                source: 'Shelter Housing Network of New York.',
                url: 'https://shnny.org/blog/entry/the-networks-statement-on-the-upcoming-2025-point-in-time-count-and-the-2024-united-states-department-of-housing-and-urban-development-findings'
            }
        ]
    },
    {
        city: 'Portland, OR',
        items: [
            {
                title: '“Homelessness.”',
                source: 'City of Portland.',
                url: 'https://www.portland.gov/wheeler/homelessness'
            },
            {
                title: '“Mayor Keith Wilson\'s Homeless Shelter Transition Projects.”',
                source: 'Oregon Public Broadcasting, 5 Feb. 2025.',
                url: 'https://www.opb.org/article/2025/02/05/portland-oregon-mayor-keith-wilson-homelessness-shelter-homeless-service-transition-projects'
            },
            {
                title: '“Multnomah County Data Shows Homelessness Crisis Continues.”',
                source: 'Oregon Public Broadcasting, 16 Apr. 2025.',
                url: 'https://www.opb.org/article/2025/04/16/multco-data-homelessness-crisis/'
            },
            {
                title: '“Shelter Services.”',
                source: 'City of Portland.',
                url: 'https://www.portland.gov/shelter-services'
            },
            {
                title: 'Templeton, Amelia. “Wait Time for City of Portland\'s Affordable Apartments Is Five Years.”',
                source: 'Willamette Week, 19 Oct. 2022.',
                url: 'https://www.wweek.com/news/city/2022/10/19/wait-time-for-city-of-portlands-affordable-apartments-is-five-years/'
            }
        ]
    },
    {
        city: 'Washington, DC',
        items: [
            {
                title: '“2024 Point-in-Time Results & ICH Strategic Planning Presentation.”',
                source: 'The Community Partnership for the Prevention of Homelessness.',
                url: 'https://community-partnership.org/resource/2024-pit-results-ich-strategic-planning-presentation/'
            },
            {
                title: '“801 East Men\'s Shelter.”',
                source: 'Catholic Charities DC.',
                url: 'https://www.catholiccharitiesdc.org/program/801-east-mens-shelter/'
            },
            {
                title: '“Adams Place Emergency Shelter.”',
                source: 'Catholic Charities DC.',
                url: 'https://www.catholiccharitiesdc.org/program/adams-place-emergency-shelter/'
            },
            {
                title: '“Downtown Day Services Center.”',
                source: 'DowntownDC Business Improvement District.',
                url: 'https://www.downtowndc.org/business-community/downtown-day-services-center/'
            },
            {
                title: '“Homelessness Prevention & Diversion.”',
                source: 'District of Columbia Department of Human Services.',
                url: 'https://dhs.dc.gov/service/homelessness-prevention-diversion'
            },
            {
                title: '“Understanding Homelessness.”',
                source: 'The Community Foundation for the National Capital Region.',
                url: 'https://www.thecommunityfoundation.org/understanding-homelessness'
            },
            {
                title: '“Washington, D.C., Homelessness Costs Billions in Health Care.”',
                source: 'CBS News.',
                url: 'https://www.cbsnews.com/news/washington-dc-homeless-health-care-costs/'
            }
        ]
    }
];

function EmbodiconsLaunch({ onStartNew }) {
    const [personas, setPersonas] = useState([]);
    const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
    const [openReferences, setOpenReferences] = useState({});
    const navigate = useNavigate();
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8787';

    useEffect(() => {
        (async () => {
            const res = await fetch(`${API_BASE}/api/personas?limit=6`);
            const data = await res.json();
            if (res.ok) setPersonas(data);
        })();
    }, []);

    const toggleReference = (city) => {
        setOpenReferences(prev => ({
            ...prev,
            [city]: !prev[city]
        }));
    };

    return (
        <>
            <div className="main-content embodicons embodicons-home" style={{ position: "relative", zIndex: "1" }}>
                <div className="embodicons-circle">
                    <div className="embodicons-circle-top"></div>
                    <div className="embodicons-circle-bottom"></div>
                    <div className="embodicons-bottom"></div>
                </div>

                <div className='embodicons-details'>
                    <h1>Embodicons</h1>
                    <span className="embodicons-description">Homelessness can affect anyone and unhoused people can come from many different backgrounds. Read stories of people from various backgrounds experiencing homelessness, based on real-world data and expert insights.</span>

                    <button className='embodicons-start' onClick={onStartNew}>Start</button>

                    <div className='embodicons-ai'>Images and descriptions are AI-generated using Google Gemini 2.5 Flash and Llama 3.1 Instruct, based off statistics and broader common narratives of homelessness. <button type="button" className='ai-why' onClick={() => setIsWhyModalOpen(true)}>Why?</button></div>
                </div>

                <div className="embodicons-existing-personas">
                    <h2>Previously Made Embodicons</h2>
                    <div className="persona-grid">
                        {personas.map((p) => (
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
                    {personas.length > 5 && (
                        <button className='embodicons-view-all' onClick={() => navigate('/embodicons/all')}>
                            View All Personas
                        </button>
                    )}
                </div>

                <div className="embodicons-references">
                    <h2>References</h2>
                    <p>These references were used to populate the curated data set that the AI model utilizes to inform the generation of the Embodicons. The AI model does not have access to any personal data about unhoused individuals, and the generated images are not based on any real unhoused people.</p>

                    <div className="embodicons-references-list">
                        {CITY_REFERENCES.map((ref) => {
                            const isOpen = !!openReferences[ref.city];
                            return (
                                <div key={ref.city} className={`embodicons-reference ${isOpen ? 'open' : 'collapsed'}`}>
                                    <h3
                                        className="embodicons-reference-header"
                                        onClick={() => toggleReference(ref.city)}
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isOpen}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                toggleReference(ref.city);
                                            }
                                        }}
                                    >
                                        <span>{ref.city}</span>
                                        <span className="reference-chevron">▶</span>
                                    </h3>

                                    <div className="embodicons-reference-wrapper">
                                        <div className="embodicons-reference-content">
                                            {ref.items.map((item, idx) => (
                                                <p key={idx}>
                                                    {item.title} <em>{item.source}</em>{' '}
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                        Link
                                                    </a>
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>


            {isWhyModalOpen && (
                <div
                    className="embodicons-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsWhyModalOpen(false);
                        }
                    }}
                >
                    <div className="embodicons-modal" role="dialog" aria-modal="true" aria-label="Why AI-generated images">
                        <button
                            type="button"
                            className="embodicons-modal-close"
                            onClick={() => setIsWhyModalOpen(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>

                        <div className="embodicons-modal-content">
                            <h2>Why use AI-generated stories and images?</h2>
                            <p>Historically, personal testimony has been a powerful way to understand the lived experience of homelessness but it comes with the potential for retraumatization and puts the onus on homeless individuals to share their stories.</p>
                            <p>
                                Embodicons uses AI to generate stories that are not based on any real individuals, but rather on a combination of real-world data and expert insights. The visuals are generated to help make each persona feel distinct and human while avoiding the use of real unhoused people's photos or stories without consent.
                            </p>
                            <p>
                                We hope that this approach helps show the diversity of the homeless experience in a way that is respectful and informative, and preserves the privacy of real individuals experiencing homelessness.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
export default EmbodiconsLaunch;

// TO DO FOR EMBODICONS PAGE LATER:
// - swap out views on click of button
// - feed selections into LLM to generate custom embodicon stories
// - store existing embodicon stories in database and retrieve based on user selections