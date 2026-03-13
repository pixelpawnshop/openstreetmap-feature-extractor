import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ResultsPanel from './components/ResultsPanel';
import './App.css';

function App() {
  const [selectedCategory, setSelectedCategory] = useState('Buildings');
  const [primaryFilters, setPrimaryFilters] = useState(['*']);
  const [secondaryFilters, setSecondaryFilters] = useState({});
  const [drawnBounds, setDrawnBounds] = useState(null);
  const [drawnGeometry, setDrawnGeometry] = useState(null);
  const [features, setFeatures] = useState(null);
  const [fullFeatures, setFullFeatures] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <Sidebar
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          primaryFilters={primaryFilters}
          setPrimaryFilters={setPrimaryFilters}
          secondaryFilters={secondaryFilters}
          setSecondaryFilters={setSecondaryFilters}
          drawnBounds={drawnBounds}
          drawnGeometry={drawnGeometry}
          setLoading={setLoading}
          setFeatures={setFeatures}
          setFullFeatures={setFullFeatures}
          setError={setError}
          setStats={setStats}
        />
        <MapView
          drawnBounds={drawnBounds}
          setDrawnBounds={setDrawnBounds}
          drawnGeometry={drawnGeometry}
          setDrawnGeometry={setDrawnGeometry}
          features={features}
          loading={loading}
        />
        {features && (
          <ResultsPanel
            features={fullFeatures || features}
            stats={stats}
            selectedCategory={selectedCategory}
          />
        )}
      </div>
      {error && (
        <div className="error-notification">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        </div>
      )}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Querying Overpass API...</p>
        </div>
      )}
    </div>
  );
}

export default App;
