import { useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import './race.css';

export default function RaceMap({ topic = 'race' }) {
    const topicName = topic.charAt(0).toUpperCase() + topic.slice(1);
    const title = topic === 'rate' ? 'Rate of Homelessness'
        : ['veteran', 'sheltered', 'unsheltered'].includes(topic) ? `${topicName} Homelessness`
        : `${topicName} and Homelessness`;
    useSEO({ title });
    useEffect(() => {
        document.documentElement.classList.add('race-map-active');
        window.scrollTo(0, 0);
        return () => document.documentElement.classList.remove('race-map-active');
    }, []);
    return (
        <main className="race-map-page">
            <iframe
                key={topic}
                title={`${title} interactive ${topic === 'race' ? 'dot-density' : 'rate'} map`}
                src={`${process.env.PUBLIC_URL}/race-map.html?topic=${topic}`}
                allowFullScreen
            />
        </main>
    );
}
