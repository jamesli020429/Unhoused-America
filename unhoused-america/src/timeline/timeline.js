import Papa from "papaparse";
import { useEffect, useState } from "react";
import { useSEO } from "../hooks/useSEO";
import './timeline.css';

const timelineImages = require.context('./Photos', false, /\.(avif|gif|jpe?g|png|webp)$/i);

function getTimelineImage(filename) {
    if (!filename) return null;

    try {
        return timelineImages(`./${filename}`);
    } catch {
        return null;
    }
}

export default function Timeline() {
    useSEO({ title: 'Timeline' });
    const [rows, setRows] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [displayRows, setDisplayRows] = useState([]);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const categories = [
        { name: 'Terminology', className: 'timelineTerminology' },
        { name: 'History', className: 'timelineHistory' },
        { name: 'Policy', className: 'timelinePolicy' },
        { name: 'Case Law', className: 'timelineCase' },
        { name: 'Federal Report', className: 'timelineFederal' }
    ];

    useEffect(() => {
        document.documentElement.classList.add('timeline-scroll-snap');

        const updateSnapOffset = () => {
            const topNavigation = document.querySelector('.top-nav-bar');
            const filters = document.querySelector('.timelineFilters');
            const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
            const navigationOffset = isDesktop ? 24 : (topNavigation?.offsetHeight || 60);
            const filterHeight = filters?.offsetHeight || 0;

            document.documentElement.style.setProperty(
                '--timeline-snap-offset',
                `${navigationOffset + filterHeight + 16}px`
            );
        };

        updateSnapOffset();
        window.addEventListener('resize', updateSnapOffset);

        return () => {
            document.documentElement.classList.remove('timeline-scroll-snap');
            document.documentElement.style.removeProperty('--timeline-snap-offset');
            window.removeEventListener('resize', updateSnapOffset);
        };
    }, []);

    useEffect(() => {
        Papa.parse("/timeline.csv", {
            download: true,
            header: true,
            complete: (result) => {
                // remove empty rows
                const data = result.data.filter(r => r.Year);
                setRows(data);
                setDisplayRows(data);
            }
        });
    }, []);

    const toggleFilter = (category) => {
        const nextFilters = selectedFilters.includes(category) ? [] : [category];
        setSelectedFilters(nextFilters);
        setIsTransitioning(true);

        setTimeout(() => {
            const nextRows = nextFilters.length === 0
                ? rows
                : rows.filter(row => nextFilters.includes(row.Category));
            setDisplayRows(nextRows);

            setIsTransitioning(false);
        }, 250);
    };

    const getCategoryCount = (categoryName) => {
        return rows.filter(row => row.Category === categoryName).length;
    };

    return (
        <div className="main-content timeline">
            
            <div className="timeline-top-semicircle"></div>

            <div className="timeline-heading">
                <h1>Timeline <span className="timeline-heading-small">of Homelessness in America</span></h1>
                <p>Situate contemporary homelessness within its broad historical, legal, and policy context over time</p>
            </div>
            

            <div className="timelineFilters">
                <h3>Filter by Category</h3>
                {categories.map(category => (
                    <button
                        key={category.name}
                        className={`timelineFilterButton ${category.className} ${selectedFilters.includes(category.name) ? 'active' : ''} ${selectedFilters.length > 0 && !selectedFilters.includes(category.name) ? 'inactive' : ''}`}
                        onClick={() => toggleFilter(category.name)}
                    >
                        {category.name} ({getCategoryCount(category.name)})
                    </button>
                ))}
            </div>

            <div className={`timelineMain ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
                {displayRows.map((row, index) => {
                    const imageSrc = getTimelineImage(row["Image File"]);

                    return (
                        <div className="timelineEntry" key={index}>
                            <div className="timelineLine">
                                <div className="timelineCircle"></div>
                            </div>

                            <div className="timelineContent">
                                <div className="timelineYear">
                                    <h2>{row.Year}</h2>
                                    <div className={`timelineCategory timeline${row.Category}`}>{row.Category}</div>
                                </div>

                                <div className="timelineDetails">
                                    <h3>{row.Name}</h3>
                                    <p>{row.Description}</p>
                                    <a className="source-link" href={row["Source URL"]}>Source: {row.Source}</a>
                                </div>
                                <div className="timelineImage">
                                    {imageSrc ? (
                                        <>
                                            <img src={imageSrc} alt={row.Photo || row.Name} />
                                            {row.Photo && <p className="timelineImageCaption">{row.Photo}</p>}
                                        </>
                                    ) : (
                                        <div
                                            className="timelineImagePlaceholder"
                                            role="img"
                                            aria-label={row.Photo || "Timeline image placeholder"}
                                        />
                                    )}
                                </div>
                                {/* Uncomment this section to make the timeline images visible. Make sure to add the images to the timelineimages.js file and import them at the top of this file. */}
                                {/* <div className="timelineImage">
                                    <img src={imgSrc} alt={row.Photo} />
                                    <p>{row.Photo}<a href={row["Photo URL"]}>🠒</a></p>
                                </div> */}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
