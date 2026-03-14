import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import './MapView.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapView({ drawnBounds, setDrawnBounds, drawnGeometry, setDrawnGeometry, features, loading }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const featureLayerRef = useRef(null);
  const [showInstructions, setShowInstructions] = useState(() => {
    // Check if user has dismissed it before
    const dismissed = localStorage.getItem('instructionsDismissed');
    return !dismissed;
  });

  const handleDismiss = () => {
    setShowInstructions(false);
    localStorage.setItem('instructionsDismissed', 'true');
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'instruction-overlay') {
      handleDismiss();
    }
  };

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [51.505, -0.09],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Initialize drawn items layer
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Initialize draw control
      const drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: {
          rectangle: {
            shapeOptions: {
              color: '#667eea',
              weight: 2,
              fillOpacity: 0.1,
            },
            showArea: false,
            metric: false,
          },
          polygon: {
            allowIntersection: false,
            shapeOptions: {
              color: '#667eea',
              weight: 2,
              fillOpacity: 0.1,
            },
            showArea: false,
            metric: false,
          },
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
        },
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
      });
      map.addControl(drawControl);

      // Handle draw created
      map.on(L.Draw.Event.CREATED, (e) => {
        drawnItems.clearLayers();
        const layer = e.layer;
        drawnItems.addLayer(layer);
        
        const bounds = layer.getBounds();
        const bbox = {
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast(),
        };
        setDrawnBounds(bbox);
        
        // Store the actual geometry as GeoJSON
        const geojson = layer.toGeoJSON();
        setDrawnGeometry(geojson.geometry);
      });

      // Handle draw edited
      map.on(L.Draw.Event.EDITED, (e) => {
        const layers = e.layers;
        layers.eachLayer((layer) => {
          const bounds = layer.getBounds();
          const bbox = {
            south: bounds.getSouth(),
            west: bounds.getWest(),
            north: bounds.getNorth(),
            east: bounds.getEast(),
          };
          setDrawnBounds(bbox);
          
          // Store the actual geometry as GeoJSON
          const geojson = layer.toGeoJSON();
          setDrawnGeometry(geojson.geometry);
        });
      });

      // Handle draw deleted
      map.on(L.Draw.Event.DELETED, () => {
        setDrawnBounds(null);
        setDrawnGeometry(null);
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Display features on map
  useEffect(() => {
    if (!mapInstanceRef.current || !features) return;

    // Remove previous feature layer
    if (featureLayerRef.current) {
      mapInstanceRef.current.removeLayer(featureLayerRef.current);
    }

    // Add new features
    const featureLayer = L.geoJSON(features, {
      style: (feature) => ({
        color: '#FF6B6B',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.3,
      }),
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          radius: 5,
          color: '#FF6B6B',
          fillColor: '#FF6B6B',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        });
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const props = feature.properties;
          let popupContent = '<div class="feature-popup">';
          
          // Display key properties
          const displayProps = ['name', 'building', 'highway', 'railway', 'waterway', 'amenity', 'landuse', 'natural', 'barrier'];
          displayProps.forEach(key => {
            if (props[key]) {
              popupContent += `<div><strong>${key}:</strong> ${props[key]}</div>`;
            }
          });
          
          // Add OSM ID
          if (props.id) {
            const osmId = props.id;
            const idType = osmId.startsWith('node') ? 'node' : osmId.startsWith('way') ? 'way' : 'relation';
            const idNum = osmId.split('/')[1];
            popupContent += `<div><a href="https://www.openstreetmap.org/${idType}/${idNum}" target="_blank">View on OSM</a></div>`;
          }
          
          popupContent += '</div>';
          layer.bindPopup(popupContent);
        }
      },
    });

    featureLayer.addTo(mapInstanceRef.current);
    featureLayerRef.current = featureLayer;

    // Fit bounds to features
    if (features.features && features.features.length > 0) {
      mapInstanceRef.current.fitBounds(featureLayer.getBounds(), { padding: [50, 50] });
    }
  }, [features]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
      {!drawnBounds && !loading && showInstructions && (
        <div className="instruction-overlay" onClick={handleOverlayClick}>
          <div className="instruction-popup">
            <button className="close-button" onClick={handleDismiss}>
              ×
            </button>
            <span className="instruction-icon">✏️</span>
            <h3>Draw an Area</h3>
            <p>Use the rectangle or polygon tool to select an area on the map</p>
            <p className="instruction-note">⚠️ <strong>Note:</strong> This tool uses OpenStreetMap data only. Feature coverage can be unevenly distributed depending on contributor activity in the region.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;
