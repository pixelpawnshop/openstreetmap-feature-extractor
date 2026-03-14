import React, { useState } from 'react';
import { exportGeoJSON, exportShapefile, exportCSV, exportKML } from '../services/exportService';
import './ResultsPanel.css';

function ResultsPanel({ features, stats, selectedCategory, drawnBounds }) {
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

  const handleViewOnGoogleMaps = () => {
    if (!drawnBounds) return;
    
    const centerLat = (drawnBounds.north + drawnBounds.south) / 2;
    const centerLng = (drawnBounds.east + drawnBounds.west) / 2;
    
    // Calculate appropriate zoom level based on bounds size
    const latDiff = Math.abs(drawnBounds.north - drawnBounds.south);
    const lngDiff = Math.abs(drawnBounds.east - drawnBounds.west);
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 15;
    if (maxDiff > 0.1) zoom = 12;
    if (maxDiff > 0.5) zoom = 10;
    if (maxDiff > 1) zoom = 8;
    
    const googleMapsUrl = `https://www.google.com/maps/@${centerLat},${centerLng},${zoom}z`;
    window.open(googleMapsUrl, '_blank');
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

          <div className="googlemaps-section">
            <button 
              className="googlemaps-btn"
              onClick={handleViewOnGoogleMaps}
              title="View this area on Google Maps"
            >
              <span className="googlemaps-icon">🗺️</span>
              <span>View on Google Maps</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultsPanel;
