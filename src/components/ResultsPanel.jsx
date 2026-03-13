import React, { useState } from 'react';
import { exportGeoJSON, exportShapefile, exportCSV, exportKML } from '../services/exportService';
import './ResultsPanel.css';

function ResultsPanel({ features, stats, selectedCategory }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExport = (format) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const baseName = `${selectedCategory.toLowerCase().replace(' ', '_')}_${timestamp}`;
      
      switch (format) {
        case 'geojson':
          exportGeoJSON(features, `${baseName}.geojson`);
          break;
        case 'shapefile':
          exportShapefile(features, baseName);
          break;
        case 'csv':
          exportCSV(features, `${baseName}.csv`);
          break;
        case 'kml':
          exportKML(features, `${baseName}.kml`);
          break;
        default:
          console.error('Unknown export format:', format);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  return (
    <div className={`results-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded && (
        <button 
          className="results-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          title="Expand panel"
          style={{ position: 'absolute', right: '20px', top: '10px' }}
        >
          ▲
        </button>
      )}

      {isExpanded && (
        <div className="results-content">
          <div className="results-header">
            <h3>Results</h3>
            <span className="results-count">{stats?.total || 0} features</span>
            <button 
              className="results-toggle"
              onClick={() => setIsExpanded(!isExpanded)}
              title="Collapse panel"
            >
              ▼
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Geometry Types</div>
              <div className="stat-values">
                {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
                  count > 0 && (
                    <div key={type} className="stat-item">
                      <span className="stat-type">{type}:</span>
                      <span className="stat-number">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">OSM Types</div>
              <div className="stat-values">
                {stats?.byOsmType && Object.entries(stats.byOsmType).map(([type, count]) => (
                  count > 0 && (
                    <div key={type} className="stat-item">
                      <span className="stat-type">{type}:</span>
                      <span className="stat-number">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="export-section">
            <h4 className="export-title">Export Data</h4>
            <div className="export-buttons">
              <button 
                className="export-btn geojson"
                onClick={() => handleExport('geojson')}
                title="Export as GeoJSON"
              >
                <span className="export-icon">📄</span>
                <span>GeoJSON</span>
              </button>
              <button 
                className="export-btn shapefile"
                onClick={() => handleExport('shapefile')}
                title="Export as Shapefile (ZIP)"
              >
                <span className="export-icon">🗂️</span>
                <span>Shapefile</span>
              </button>
              <button 
                className="export-btn csv"
                onClick={() => handleExport('csv')}
                title="Export as CSV"
              >
                <span className="export-icon">📊</span>
                <span>CSV</span>
              </button>
              <button 
                className="export-btn kml"
                onClick={() => handleExport('kml')}
                title="Export as KML"
              >
                <span className="export-icon">🌍</span>
                <span>KML</span>
              </button>
            </div>
          </div>

          <div className="info-section">
            <p className="info-text">
              💡 <strong>Tip:</strong> For shapefiles, multiple files will be downloaded in a ZIP archive.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsPanel;
