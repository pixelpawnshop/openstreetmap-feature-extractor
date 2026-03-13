import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Export GeoJSON as a file
 */
export const exportGeoJSON = (geojson, filename = 'osm_features.geojson') => {
  const dataStr = JSON.stringify(geojson, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  saveAs(dataBlob, filename);
};

/**
 * Export as Shapefile (zipped) - using tokml for conversion
 * Note: For full shapefile support, users should use QGIS or online converters
 */
export const exportShapefile = async (geojson, filename = 'osm_features') => {
  // For now, export as GeoJSON with instructions
  alert('Shapefile export requires desktop GIS software.\n\nDownloading as GeoJSON instead.\nYou can convert this to Shapefile using:\n• QGIS (free)\n• ArcGIS\n• Online converters (mapshaper.org)');
  exportGeoJSON(geojson, `${filename}.geojson`);
};

/**
 * Export as CSV with WKT geometry
 */
export const exportCSV = (geojson, filename = 'osm_features.csv') => {
  const features = geojson.features;
  
  if (features.length === 0) {
    throw new Error('No features to export');
  }
  
  // Collect all unique property keys
  const allKeys = new Set();
  features.forEach(feature => {
    Object.keys(feature.properties).forEach(key => allKeys.add(key));
  });
  
  const keys = ['geometry_type', 'lon', 'lat', ...Array.from(allKeys)];
  
  // Build CSV rows
  const csvRows = [keys.join(',')];
  
  features.forEach(feature => {
    const row = [];
    const geom = feature.geometry;
    const props = feature.properties;
    
    row.push(geom.type); // geometry_type
    
    // Add approximate center lon/lat
    if (geom.type === 'Point') {
      row.push(geom.coordinates[0]);
      row.push(geom.coordinates[1]);
    } else if (geom.type === 'LineString' || geom.type === 'Polygon') {
      const coords = geom.type === 'Polygon' ? geom.coordinates[0] : geom.coordinates;
      const centerLon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const centerLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      row.push(centerLon);
      row.push(centerLat);
    } else {
      row.push('');
      row.push('');
    }
    
    // Add properties
    keys.slice(3).forEach(key => {
      const value = props[key] || '';
      // Escape commas and quotes
      const escaped = String(value).replace(/"/g, '""');
      row.push(`"${escaped}"`);
    });
    
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  saveAs(dataBlob, filename);
};

/**
 * Export as KML
 */
export const exportKML = (geojson, filename = 'osm_features.kml') => {
  let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
  kml += '<Document>\n';
  kml += '<name>OSM Features</name>\n';
  
  geojson.features.forEach(feature => {
    const props = feature.properties;
    const geom = feature.geometry;
    
    kml += '<Placemark>\n';
    
    // Add name if available
    if (props.name) {
      kml += `<name>${escapeXml(props.name)}</name>\n`;
    }
    
    // Add description with properties
    kml += '<description><![CDATA[';
    Object.entries(props).forEach(([key, value]) => {
      if (key !== 'name') {
        kml += `<b>${key}:</b> ${value}<br/>`;
      }
    });
    kml += ']]></description>\n';
    
    // Add geometry
    if (geom.type === 'Point') {
      kml += '<Point>\n';
      kml += `<coordinates>${geom.coordinates[0]},${geom.coordinates[1]}</coordinates>\n`;
      kml += '</Point>\n';
    } else if (geom.type === 'LineString') {
      kml += '<LineString>\n';
      kml += '<coordinates>\n';
      geom.coordinates.forEach(coord => {
        kml += `${coord[0]},${coord[1]} `;
      });
      kml += '\n</coordinates>\n';
      kml += '</LineString>\n';
    } else if (geom.type === 'Polygon') {
      kml += '<Polygon>\n';
      kml += '<outerBoundaryIs>\n';
      kml += '<LinearRing>\n';
      kml += '<coordinates>\n';
      geom.coordinates[0].forEach(coord => {
        kml += `${coord[0]},${coord[1]} `;
      });
      kml += '\n</coordinates>\n';
      kml += '</LinearRing>\n';
      kml += '</outerBoundaryIs>\n';
      kml += '</Polygon>\n';
    }
    
    kml += '</Placemark>\n';
  });
  
  kml += '</Document>\n';
  kml += '</kml>';
  
  const dataBlob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  saveAs(dataBlob, filename)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};
