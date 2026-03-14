import React from 'react';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <span className="header-icon">🗺️</span>
          <h1>OSM Feature Extractor</h1>
        </div>
        <div className="header-right">
          <a 
            href="https://wiki.openstreetmap.org/wiki/Map_features" 
            target="_blank" 
            rel="noopener noreferrer"
            className="header-link"
          >
            📚 OSM Wiki
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
