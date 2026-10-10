import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import nation from './assets/us-nation-albers.json';
import './map.css';

// Decode the existing projected US silhouette; no extra map library is needed.
const decodedArcs = nation.arcs.map(arc => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
        x += dx;
        y += dy;
        return [
            x * nation.transform.scale[0] + nation.transform.translate[0],
            y * nation.transform.scale[1] + nation.transform.translate[1],
        ];
    });
});
const outline = nation.objects.nation.geometries.flatMap(geometry =>
    geometry.arcs.flatMap(polygon => polygon.map(ring => {
        const points = ring.flatMap(index => index < 0
            ? [...decodedArcs[~index]].reverse() : decodedArcs[index]);
        return points.map(([x, y], index) => (index ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)).join(' ') + 'Z';
    }))
).join(' ');

function Map() {
    useSEO({ title: 'Map' });
    useEffect(() => {
        document.documentElement.classList.add('map-scroll-snap');
        return () => document.documentElement.classList.remove('map-scroll-snap');
    }, []);
    return (
        <main className="main-content map-page">
            <section className="map-overview" aria-labelledby="map-overview-title">
                <div className="map-overview-heading">
                    <div className="map-overview-title-band">
                        <svg className="map-overview-silhouette" viewBox="-65 0 1035 620" aria-hidden="true" focusable="false">
                            <path d={outline} fill="currentColor" fillRule="evenodd" />
                        </svg>
                        <h1 id="map-overview-title">Map<span className="map-overview-subtitle">of homelessness in America</span></h1>
                    </div>
                    <p>Mapping homelessness across the US to identify demographic disparities.</p>
                </div>
                <div className="map-overview-visual">
                    <iframe
                        className="map-overview-embed"
                        title="Homelessness Rate in the United States"
                        src={`${process.env.PUBLIC_URL}/homelessness-rate.html`}
                        allowFullScreen
                    />
                    <a className="map-open-link" href="https://www.arcgis.com/apps/mapviewer/index.html?webmap=8de672bf657744e4b30558249718d8d2" target="_blank" rel="noopener noreferrer">Open map in a new tab</a>
                </div>
                <div className="map-overview-copy">
                    <p>Using HUD Continuum of Care regions, our platform will feature customizable mapping of homelessness across the US, disaggregated by demographics to identify regional “hot spots” and thematic disparities often overlooked in other publicly available data.</p>
                </div>
            </section>
            <section className="map-landscape" aria-labelledby="map-landscape-title">
                <h2 id="map-landscape-title">Understanding the Landscape of U.S. Homelessness</h2>
                <section className="map-topic-group" aria-labelledby="map-nature-title">
                    <h3 id="map-nature-title">What is the Nature of Homelessness?</h3>
                    <p>Explore how rates of homelessness vary across the United States, and how sheltered and unsheltered experiences differ from place to place.</p>
                    <div className="map-topic-placeholders map-topic-placeholders-three" aria-label="Nature of homelessness topics">
                        {[
                            { slug: 'rate', title: 'Rate of Homelessness' },
                            { slug: 'unsheltered', title: 'Unsheltered Homelessness' },
                            { slug: 'sheltered', title: 'Sheltered Homelessness' },
                        ].map(topic => (
                            <Link key={topic.slug} to={`/map/${topic.slug}`}>{topic.title}</Link>
                        ))}
                    </div>
                </section>
                <section className="map-topic-group" aria-labelledby="map-demographics-title">
                    <h3 id="map-demographics-title">Who Experiences Homelessness?</h3>
                    <p>Explore homelessness across race, age, gender, and veteran status to better understand demographic disparities and the diversity of unhoused experiences.</p>
                    <div className="map-topic-placeholders map-topic-placeholders-four" aria-label="Demographic topics">
                        {['Race', 'Age', 'Gender', 'Veteran'].map(topic => (
                            <Link key={topic} to={`/map/${topic.toLowerCase()}`}>{topic} and Homelessness</Link>
                        ))}
                    </div>
                </section>
            </section>
        </main>
    );
}
export default Map;
