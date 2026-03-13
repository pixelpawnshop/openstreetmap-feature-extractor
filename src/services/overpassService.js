import axios from 'axios';
import * as turf from '@turf/turf';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const MAX_BBOX_SIZE = 0.25; // Maximum 0.25 degrees per side
const PREVIEW_LIMIT = 3000; // Maximum features to return

/**
 * Validate bounding box size
 */
export const validateBbox = (bbox) => {
  const width = Math.abs(bbox.east - bbox.west);
  const height = Math.abs(bbox.north - bbox.south);
  
  if (width > MAX_BBOX_SIZE || height > MAX_BBOX_SIZE) {
    throw new Error(
      `Area too large! Maximum size is ${MAX_BBOX_SIZE}° × ${MAX_BBOX_SIZE}°. ` +
      `Your selection: ${width.toFixed(3)}° × ${height.toFixed(3)}°`
    );
  }
  
  return true;
};

/**
 * Build Overpass QL query
 */
export const buildOverpassQuery = (bbox, osmKey, primaryFilters, secondaryFilters = {}) => {
  validateBbox(bbox);
  
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  let query = '[out:json][timeout:90];(\n';
  
  // Build primary filter queries
  primaryFilters.forEach(primaryValue => {
    const tagFilter = primaryValue === '*' ? `["${osmKey}"]` : `["${osmKey}"="${primaryValue}"]`;
    
    // Add secondary filters if any
    let secondaryFilterStr = '';
    Object.entries(secondaryFilters).forEach(([secKey, secValue]) => {
      if (secValue && secValue !== '*') {
        secondaryFilterStr += `["${secKey}"="${secValue}"]`;
      }
    });
    
    // Query nodes, ways, and relations
    query += `  node${tagFilter}${secondaryFilterStr}(${bboxStr});\n`;
    query += `  way${tagFilter}${secondaryFilterStr}(${bboxStr});\n`;
    query += `  relation${tagFilter}${secondaryFilterStr}(${bboxStr});\n`;
  });
  
  query += `);\n`;
  query += 'out geom;';
  
  return query;
};

/**
 * Execute Overpass API query
 */
export const executeOverpassQuery = async (query) => {
  try {
    const response = await axios.post(
      OVERPASS_API_URL,
      query,
      {
        headers: {
          'Content-Type': 'text/plain',
        },
        timeout: 120000, // 120 seconds (2 minutes)
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Query timeout - try a smaller area or fewer features');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded - please wait a moment and try again');
    } else if (error.response?.status === 504) {
      throw new Error('Gateway timeout - try a smaller area');
    } else {
      throw new Error(`Overpass API error: ${error.message}`);
    }
  }
};

/**
 * Convert Overpass JSON to GeoJSON
 */
export const overpassToGeoJSON = (overpassData, applyLimit = true) => {
  const features = [];
  
  if (!overpassData.elements || overpassData.elements.length === 0) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }
  
  // Optionally limit for preview
  const elements = applyLimit ? overpassData.elements.slice(0, PREVIEW_LIMIT) : overpassData.elements;
  
  elements.forEach(element => {
    let geometry = null;
    
    // Handle different element types
    if (element.type === 'node') {
      geometry = {
        type: 'Point',
        coordinates: [element.lon, element.lat],
      };
    } else if (element.type === 'way') {
      if (element.geometry && element.geometry.length > 0) {
        const coordinates = element.geometry.map(node => [node.lon, node.lat]);
        
        // Check if it's a closed way (polygon)
        const isClosed = 
          coordinates.length > 2 &&
          coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
          coordinates[0][1] === coordinates[coordinates.length - 1][1];
        
        if (isClosed) {
          geometry = {
            type: 'Polygon',
            coordinates: [coordinates],
          };
        } else {
          geometry = {
            type: 'LineString',
            coordinates: coordinates,
          };
        }
      }
    } else if (element.type === 'relation') {
      // Handle relations (multipolygons, etc.)
      if (element.members) {
        const outerWays = [];
        element.members.forEach(member => {
          if (member.role === 'outer' && member.geometry) {
            const coords = member.geometry.map(node => [node.lon, node.lat]);
            outerWays.push(coords);
          }
        });
        
        if (outerWays.length > 0) {
          geometry = {
            type: 'MultiPolygon',
            coordinates: outerWays.map(way => [way]),
          };
        }
      }
    }
    
    if (geometry) {
      features.push({
        type: 'Feature',
        id: `${element.type}/${element.id}`,
        geometry: geometry,
        properties: {
          ...element.tags,
          osm_type: element.type,
          osm_id: element.id,
          id: `${element.type}/${element.id}`,
        },
      });
    }
  });
  
  return {
    type: 'FeatureCollection',
    features: features,
    metadata: {
      total: overpassData.elements.length,
      displayed: features.length,
      preview: overpassData.elements.length > PREVIEW_LIMIT,
    },
  };
};

/**
 * Calculate statistics from GeoJSON
 */
export const calculateStats = (geojson) => {
  const stats = {
    total: geojson.features.length,
    byType: {
      Point: 0,
      LineString: 0,
      Polygon: 0,
      MultiPolygon: 0,
    },
    byOsmType: {
      node: 0,
      way: 0,
      relation: 0,
    },
  };
  
  geojson.features.forEach(feature => {
    const geomType = feature.geometry.type;
    if (stats.byType[geomType] !== undefined) {
      stats.byType[geomType]++;
    }
    
    const osmType = feature.properties.osm_type;
    if (stats.byOsmType[osmType] !== undefined) {
      stats.byOsmType[osmType]++;
    }
  });
  
  return stats;
};

/**
 * Filter and clip features to only show parts within the drawn geometry
 */
const filterFeaturesByGeometry = (geojson, drawnGeometry) => {
  if (!drawnGeometry) {
    return geojson;
  }
  
  const drawnPolygon = drawnGeometry.type === 'Polygon' 
    ? turf.polygon(drawnGeometry.coordinates)
    : drawnGeometry.type === 'MultiPolygon'
    ? turf.multiPolygon(drawnGeometry.coordinates)
    : null;
  
  if (!drawnPolygon) {
    return geojson;
  }
  
  const filteredFeatures = [];
  
  geojson.features.forEach(feature => {
    try {
      const featureGeom = feature.geometry;
      
      // Handle different geometry types
      if (featureGeom.type === 'Point') {
        // Points: only include if inside polygon
        const point = turf.point(featureGeom.coordinates);
        if (turf.booleanPointInPolygon(point, drawnPolygon)) {
          filteredFeatures.push(feature);
        }
      } else if (featureGeom.type === 'LineString') {
        // Lines: include if they intersect the polygon
        // Line clipping is complex, so we include the full line if any part is inside
        const line = turf.lineString(featureGeom.coordinates);
        if (turf.booleanIntersects(line, drawnPolygon)) {
          filteredFeatures.push(feature);
        }
      } else if (featureGeom.type === 'Polygon') {
        // Polygons: intersect with drawn polygon
        const poly = turf.polygon(featureGeom.coordinates);
        if (turf.booleanIntersects(poly, drawnPolygon)) {
          try {
            const intersection = turf.intersect(turf.featureCollection([poly, drawnPolygon]));
            if (intersection) {
              filteredFeatures.push({
                ...feature,
                geometry: intersection.geometry,
              });
            }
          } catch (e) {
            // If intersection fails, include original if it intersects
            filteredFeatures.push(feature);
          }
        }
      } else if (featureGeom.type === 'MultiPolygon') {
        // MultiPolygons: intersect each polygon
        const multiPoly = turf.multiPolygon(featureGeom.coordinates);
        if (turf.booleanIntersects(multiPoly, drawnPolygon)) {
          try {
            const intersection = turf.intersect(turf.featureCollection([multiPoly, drawnPolygon]));
            if (intersection) {
              filteredFeatures.push({
                ...feature,
                geometry: intersection.geometry,
              });
            }
          } catch (e) {
            // If intersection fails, include original
            filteredFeatures.push(feature);
          }
        }
      }
    } catch (err) {
      console.warn('Error filtering/clipping feature:', err);
      // Skip features that cause errors
    }
  });
  
  return {
    ...geojson,
    features: filteredFeatures,
  };
};

/**
 * Main function to fetch OSM features
 */
export const fetchOSMFeatures = async (bbox, osmKey, primaryFilters, secondaryFilters = {}, drawnGeometry = null) => {
  try {
    // Build query
    const query = buildOverpassQuery(bbox, osmKey, primaryFilters, secondaryFilters);
    
    // Execute query
    const overpassData = await executeOverpassQuery(query);
    
    // Convert to GeoJSON (full dataset, no preview limit)
    let fullGeojson = overpassToGeoJSON(overpassData, false);
    
    // Filter by actual drawn geometry (not just bounding box)
    fullGeojson = filterFeaturesByGeometry(fullGeojson, drawnGeometry);
    
    // Create display version with preview limit
    const displayGeojson = {
      ...fullGeojson,
      features: fullGeojson.features.slice(0, PREVIEW_LIMIT),
      metadata: {
        total: fullGeojson.features.length,
        displayed: Math.min(fullGeojson.features.length, PREVIEW_LIMIT),
        preview: fullGeojson.features.length > PREVIEW_LIMIT,
      },
    };
    
    // Calculate statistics from full dataset
    const stats = calculateStats(fullGeojson);
    
    return {
      displayGeojson,
      fullGeojson,
      stats,
      metadata: displayGeojson.metadata,
    };
  } catch (error) {
    throw error;
  }
};
