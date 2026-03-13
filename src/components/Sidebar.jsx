import React, { useState } from 'react';
import { FEATURE_CATEGORIES, getCategoryConfig } from '../data/featureDefinitions';
import { fetchOSMFeatures } from '../services/overpassService';
import './Sidebar.css';

function Sidebar({
  selectedCategory,
  setSelectedCategory,
  primaryFilters,
  setPrimaryFilters,
  secondaryFilters,
  setSecondaryFilters,
  drawnBounds,
  drawnGeometry,
  setLoading,
  setFeatures,
  setFullFeatures,
  setError,
  setStats,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categoryConfig = getCategoryConfig(selectedCategory);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPrimaryFilters(['*']);
    setSecondaryFilters({});
  };

  const handlePrimaryFilterChange = (value) => {
    if (value === '*') {
      setPrimaryFilters(['*']);
    } else {
      const newFilters = primaryFilters.includes('*')
        ? [value]
        : primaryFilters.includes(value)
        ? primaryFilters.filter(f => f !== value)
        : [...primaryFilters, value];
      
      setPrimaryFilters(newFilters.length === 0 ? ['*'] : newFilters);
    }
  };

  const handleSecondaryFilterChange = (key, value) => {
    setSecondaryFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExtract = async () => {
    if (!drawnBounds) {
      setError('Please draw an area on the map first');
      return;
    }

    setLoading(true);
    setError(null);
    setFeatures(null);
    setFullFeatures(null);

    try {
      const result = await fetchOSMFeatures(
        drawnBounds,
        categoryConfig.osmKey,
        primaryFilters,
        secondaryFilters,
        drawnGeometry
      );

      setFeatures(result.displayGeojson);
      setFullFeatures(result.fullGeojson);
      setStats(result.stats);

      if (result.metadata?.preview) {
        setError(`Showing ${result.metadata.displayed} of ${result.metadata.total} features on map. Full dataset (${result.metadata.total}) will be exported.`);
      }
    } catch (err) {
      setError(err.message);
      setFeatures(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <button 
          className="sidebar-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? '◀' : '▶'}
        </button>

        {isExpanded && (
          <div className="sidebar-content">
            <div className="sidebar-section">
              <h3 className="sidebar-title">Feature Category</h3>
              <div className="category-grid">
                {Object.entries(FEATURE_CATEGORIES).map(([name, config]) => (
                  <button
                    key={name}
                    className={`category-btn ${selectedCategory === name ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(name)}
                  >
                    <span className="category-icon">{config.icon}</span>
                    <span className="category-name">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <h3 className="sidebar-title">
                {selectedCategory} Types
              </h3>
              <div className="filter-list">
                {Object.entries(categoryConfig.primary).map(([value, label]) => (
                  <label key={value} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={primaryFilters.includes(value)}
                      onChange={() => handlePrimaryFilterChange(value)}
                      disabled={value !== '*' && primaryFilters.includes('*')}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {categoryConfig.secondary && (
              <div className="sidebar-section">
                <h3 className="sidebar-title">Additional Filters</h3>
                {Object.entries(categoryConfig.secondary).map(([key, options]) => (
                  <div key={key} className="secondary-filter">
                    <label className="secondary-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <select
                      className="secondary-select"
                      value={secondaryFilters[key] || ''}
                      onChange={(e) => handleSecondaryFilterChange(key, e.target.value)}
                    >
                      <option value="">Any</option>
                      {Object.entries(options).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="sidebar-section">
              <button
                className="extract-btn"
                onClick={handleExtract}
                disabled={!drawnBounds}
              >
                <span className="extract-icon">🔍</span>
                Extract Features
              </button>
              {!drawnBounds && (
                <p className="help-text">Draw an area on the map to begin</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Sidebar;
