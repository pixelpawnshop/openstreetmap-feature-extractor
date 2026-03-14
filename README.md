# OSM Feature Extractor

A web-based tool for extracting and analyzing OpenStreetMap features with interactive polygon drawing capabilities. Draw custom areas on the map, filter by feature categories, and export data in multiple GIS formats.

## Overview

OSM Feature Extractor provides an intuitive interface for querying OpenStreetMap data within user-defined areas of interest. Built with React and Leaflet, it enables spatial analysis and data extraction without requiring desktop GIS software or technical expertise.

## Features

### Interactive Map Drawing
- Draw polygons or rectangles to define custom areas of interest
- Edit and modify drawn shapes before querying
- Precise geometry-based filtering (only features within drawn boundaries)

### Feature Categories
The tool supports extraction of 8 major OpenStreetMap feature categories:

- **Buildings** - Residential, commercial, industrial, schools, hospitals, religious structures
- **Roads** - Motorways, highways, residential streets, pedestrian paths, cycling infrastructure
- **Railways** - Rail lines, subway systems, tram lines, stations, platforms
- **Waterways** - Rivers, streams, canals, dams, weirs
- **Amenities** - Restaurants, hospitals, schools, banks, fuel stations, emergency services
- **Land Use** - Residential zones, commercial areas, farmland, forests, recreational grounds
- **Natural Features** - Water bodies, wetlands, forests, peaks, beaches
- **Barriers** - Walls, fences, gates, bollards

### Hierarchical Filtering
- Primary filters for specific feature types (e.g., "Motorway", "Hospital")
- Secondary attribute filters (surface type, accessibility, etc.)
- Flexible selection allowing single or multiple feature types

### Data Export 
Export extracted features in multiple standard formats:

- **GeoJSON** - Web-friendly format for further analysis
- **CSV** - Tabular format with geometry information
- **KML** - Compatible with Google Earth and other platforms
- **Shapefile** - Export as GeoJSON with conversion instructions

### Performance Optimization
- Displays up to 3,000 features on map for smooth performance
- Exports complete datasets regardless of display limits
- Automatic geometry clipping to area of interest boundaries
- Efficient client-side processing with Turf.js

## Technical Stack

**Frontend Framework**
- React 18 with functional components and hooks
- Vite for fast development and optimized builds

**Mapping Libraries**
- Leaflet 1.9 for map rendering
- Leaflet.draw for interactive polygon drawing
- OpenStreetMap tile layers

**Geospatial Processing**
- Turf.js for geometry operations and spatial analysis
- Overpass API for OpenStreetMap data queries
- Client-side feature filtering and clipping

**Deployment**
- GitHub Pages for free hosting
- Automated deployment via GitHub Actions

## Installation

### Prerequisites
- Node.js 18 or higher
- npm package manager

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/osm-feature-extractor.git
cd osm-feature-extractor

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000/osm-feature-extractor/`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## Usage Guide

### Basic Workflow

1. **Define Area of Interest**
   - Use the rectangle or polygon drawing tool in the map toolbar
   - Draw your desired area on the map
   - Edit or delete the area if needed

2. **Select Feature Category**
   - Choose from 8 available categories in the sidebar
   - Each category has specific feature types

3. **Apply Filters**
   - Select specific feature types (e.g., "Motorway" for roads)
   - Choose "All" to include all types in the category
   - Apply secondary filters for additional attributes

4. **Extract Features**
   - Click "Extract Features" to query OpenStreetMap
   - Wait for processing (may take 30-90 seconds for large areas)
   - View results displayed on the map

5. **Export Data**
   - Review statistics in the results panel
   - Choose export format (GeoJSON, CSV, or KML)
   - Download complete dataset for further analysis

### Query Limitations

**Bounding Box Size**
- Maximum area: 0.25° × 0.25° (approximately 27km × 27km at equator)
- Larger areas may result in timeout errors

**Feature Display**
- Map preview: Maximum 3,000 features
- Export: Complete dataset with all features
- Memory-intensive queries may require smaller areas

**API Timeouts**
- Query timeout: 90 seconds
- HTTP timeout: 120 seconds
- Retry if initial query fails due to server load

## Configuration

### Overpass API Endpoint

The application uses the public Overpass API. For heavy usage, consider running your own instance:

Edit `src/services/overpassService.js`:

```javascript
const OVERPASS_API_URL = 'https://your-overpass-instance.com/api/interpreter';
```

### Display Limits

Adjust feature display limits in `src/services/overpassService.js`:

```javascript
const PREVIEW_LIMIT = 3000; // Maximum features shown on map
const MAX_BBOX_SIZE = 0.25; // Maximum bounding box dimension
```

### GitHub Pages Deployment

Update the base path in `vite.config.js` to match your repository name:

```javascript
export default defineConfig({
  base: '/your-repo-name/',
  // ...
});
```

## Project Structure

```
osm-feature-extractor/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Application header and navigation
│   │   ├── Sidebar.jsx             # Category selection and filters
│   │   ├── MapView.jsx             # Leaflet map with drawing tools
│   │   └── ResultsPanel.jsx        # Statistics display and export controls
│   ├── services/
│   │   ├── overpassService.js      # Overpass API integration and filtering
│   │   └── exportService.js        # Multi-format data export
│   ├── data/
│   │   └── featureDefinitions.js   # OSM category and filter definitions
│   ├── App.jsx                     # Main application component
│   ├── main.jsx                    # Application entry point
│   └── index.css                   # Global styles
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions deployment workflow
├── index.html                      # HTML template
├── vite.config.js                  # Vite configuration
└── package.json                    # Dependencies and scripts
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally

### Code Architecture

**State Management**
- React hooks (useState, useEffect) for component state
- Props drilling for component communication
- No external state management library required

**Map Integration**
- Leaflet instance managed with useRef
- Event handlers for draw actions
- Dynamic layer management for features

**API Communication**
- Axios for HTTP requests
- Custom query builder for Overpass QL
- Error handling and timeout management

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

### Potential Enhancements

- Additional OSM feature categories (shops, tourism, historic)
- Custom Overpass query builder for advanced users
- Batch processing for multiple areas
- Advanced filtering by feature properties
- Integration with routing services
- Dark mode theme
- Multi-language support

## License

This project is open source and available under the MIT License.

## Acknowledgments

- OpenStreetMap contributors for comprehensive geospatial data
- Overpass API developers for powerful query capabilities
- Leaflet and Turf.js communities for excellent geospatial libraries

## Resources

- [OpenStreetMap Wiki - Map Features](https://wiki.openstreetmap.org/wiki/Map_features)
- [Overpass API Documentation](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Leaflet Documentation](https://leafletjs.com/)
- [Turf.js Documentation](https://turfjs.org/)

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Consult the OpenStreetMap community forums
- Review Overpass API documentation for query optimization
