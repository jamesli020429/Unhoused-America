import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// components
import './App.css';
import Nav from './components/navigation';

// pages
import Home from './pages/home';
import EmbodiconsHome from './embodicons/embodicons-home';
import EmbodiconsPersonaView from './embodicons/embodicons-personaview';
import EmbodiconsAll from './embodicons/embodicons-all';

import ArticleView from './articles/article-view';
import ArticlesList from './articles/articles-list';

import Map from './maps/map';
import Timeline from './timeline/timeline';

const TRANSITION_MS = 240;

function AppRoutesWithTransitions() {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('entering');
  const timerRef = useRef(null);

  useEffect(() => {
    if (transitionStage !== 'entering') return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTransitionStage('idle');
    }, TRANSITION_MS);
  }, [transitionStage]);

  useEffect(() => {
    const nextKey = `${location.pathname}${location.search}${location.hash}`;
    const currentKey = `${displayedLocation.pathname}${displayedLocation.search}${displayedLocation.hash}`;
    if (nextKey === currentKey) return;

    setTransitionStage('exiting');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDisplayedLocation(location);
      setTransitionStage('entering');
    }, TRANSITION_MS);
  }, [location, displayedLocation]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={`route-transition ${transitionStage}`}>
      <Routes location={displayedLocation}>
        <Route path="/" element={<Home />} />

        {/* Enmbodicons */}
        <Route path="/embodicons" element={<EmbodiconsHome />} />
        <Route path="/embodicons/all" element={<EmbodiconsAll />} />
        <Route path="/embodicons/persona/:id" element={<EmbodiconsPersonaView />} />

        {/* Articles */}
        <Route path="/article/:filename" element={<ArticleView />} />
        <Route path="/article" element={<ArticlesList />} />
        <Route path="/articles" element={<ArticlesList />} />

        <Route path="/map" element={<Map />} />
        <Route path="/timeline" element={<Timeline />} />
      </Routes>


      <div className="footer">
        <p>Unhoused America is a special edition of <a href="https://www.ameriquests.org" target="_blank" rel="noopener noreferrer">AmeriQuests</a>, released in 2026.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <Router>
        <Nav />
        <AppRoutesWithTransitions />
      </Router>
    </div>
  );
}

export default App;