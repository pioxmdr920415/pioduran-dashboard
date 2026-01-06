import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-measure';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-measure/dist/leaflet-measure.css';
import CachedTileLayer from './CachedTileLayer';
import MapCacheControl from './MapCacheControl';
import LayerManager from './LayerManager';
import GeospatialAnalysis from './GeospatialAnalysis';
import OfflineStatus from './OfflineStatus';
import { TileLayer } from 'react-leaflet';

// Fix for Leaflet's default icon issue with Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to capture map ref
const MapInitializer = ({ setMapRef, mapType, center, zoom, setDrawControl, setMeasureControl }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      setMapRef(map);
    }
  }, [map, setMapRef]);

  // Initialize draw control
  useEffect(() => {
    if (!map) return;

    // Initialize draw control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: L.featureGroup().addTo(map)
      },
      draw: {
        polygon: true,
        polyline: true,
        rectangle: false,
        circle: false,
        marker: true,
        circlemarker: false
      }
    });

    // Initialize measure control
    const measureControl = new L.Control.Measure({
      position: 'topleft',
      primaryLengthUnit: 'meters',
      secondaryLengthUnit: 'kilometers',
      primaryAreaUnit: 'sqmeters',
      secondaryAreaUnit: 'hectares',
      activeColor: '#ABE2A8',
      completedColor: '#C8F7C5'
    });

    setDrawControl(drawControl);
    setMeasureControl(measureControl);

    // Cleanup
    return () => {
      if (map && drawControl) {
        try {
          map.removeControl(drawControl);
        } catch (e) {
          // Control might not be added yet
        }
      }
      if (map && measureControl) {
        try {
          map.removeControl(measureControl);
        } catch (e) {
          // Control might not be added yet
        }
      }
    };
  }, [map, setDrawControl, setMeasureControl]);

  return null;
};

const MapComponent = ({ mapType, center, zoom, fullWidth = false }) => {
  const mapRef = useRef(null);
  const [drawControl, setDrawControl] = useState(null);
  const [measureControl, setMeasureControl] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [drawnItems, setDrawnItems] = useState([]);
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

  const setMapRef = (map) => {
    mapRef.current = map;
  };

  // Cache event handlers
  const handleCacheHit = useCallback(() => {
    setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    if (window.updateMapCacheStats) {
      window.updateMapCacheStats('hits');
    }
  }, []);

  const handleCacheMiss = useCallback(() => {
    setCacheStats(prev => ({ ...prev, misses: prev.misses + 1 }));
    if (window.updateMapCacheStats) {
      window.updateMapCacheStats('misses');
    }
  }, []);

  // Handle map type changes
  useEffect(() => {
    if (!mapRef.current || !drawControl || !measureControl) return;

    const map = mapRef.current;

    // Clear existing controls
    map.removeControl(drawControl);
    map.removeControl(measureControl);

    // Add controls based on map type
    if (mapType === 'interactive' || mapType === 'pio_duran' || mapType === 'panorama') {
      map.addControl(drawControl);
      map.addControl(measureControl);
    }

    // Set view based on map type
    let mapCenter, mapZoom;
    switch (mapType) {
      case 'interactive':
        mapCenter = [13.0485, 123.4567]; // Philippines
        mapZoom = 12;
        break;
      case 'pio_duran':
        mapCenter = [13.0485, 123.4567]; // Pio Duran
        mapZoom = 14;
        break;
      case 'panorama':
        mapCenter = [13.0485, 123.4567]; // Pio Duran panorama
        mapZoom = 15;
        break;
      default:
        mapCenter = center || [13.0485, 123.4567];
        mapZoom = zoom || 12;
    }

    map.setView(mapCenter, mapZoom);

  }, [mapType, drawControl, measureControl, center, zoom]);

  // Handle drawing events
  useEffect(() => {
    if (!mapRef.current || !drawControl) return;

    const map = mapRef.current;
    const featureGroup = L.featureGroup().addTo(map);

    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      featureGroup.addLayer(layer);
      
      const newItem = {
        id: Date.now(),
        type: e.layerType,
        layer: layer,
        coordinates: getLayerCoordinates(layer)
      };
      
      setDrawnItems(prev => [...prev, newItem]);
    });

    map.on('draw:edited', (e) => {
      const layers = e.layers;
      layers.eachLayer(layer => {
        setDrawnItems(prev => 
          prev.map(item => 
            item.layer === layer 
              ? { ...item, coordinates: getLayerCoordinates(layer) }
              : item
          )
        );
      });
    });

    map.on('draw:deleted', (e) => {
      const layers = e.layers;
      layers.eachLayer(layer => {
        setDrawnItems(prev => prev.filter(item => item.layer !== layer));
      });
    });

    return () => {
      map.off(L.Draw.Event.CREATED);
      map.off('draw:edited');
      map.off('draw:deleted');
    };
  }, [drawControl]);

  const getLayerCoordinates = (layer) => {
    if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
      return layer.getLatLngs();
    } else if (layer instanceof L.Marker) {
      return [layer.getLatLng()];
    }
    return [];
  };

  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    
    // Disable all drawing modes first
    if (drawControl) {
      const handlers = drawControl._toolbars.draw._modes;
      Object.keys(handlers).forEach(key => {
        if (handlers[key].handler) {
          handlers[key].handler.disable();
        }
      });
    }

    // Enable selected tool
    if (tool && drawControl) {
      const handler = drawControl._toolbars.draw._modes[tool]?.handler;
      if (handler) {
        handler.enable();
      }
    }
  };

  const clearAllDrawings = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.eachLayer(layer => {
        if (layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
    }
    setDrawnItems([]);
  };

  const Toolbar = () => (
    <div className="absolute top-4 left-14 z-[1000] flex flex-wrap gap-2 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
      <button 
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
          activeTool === 'marker' 
            ? 'bg-blue-500 text-white shadow-md' 
            : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
        }`}
        onClick={() => handleToolSelect('marker')}
        title="Add Marker"
      >
        <span className="text-lg">📍</span> Add Marker
      </button>

      <button 
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
          activeTool === 'polyline' 
            ? 'bg-purple-500 text-white shadow-md' 
            : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
        }`}
        onClick={() => handleToolSelect('polyline')}
        title="Draw Line"
      >
        <span className="text-lg">✏️</span> Draw Line
      </button>

      <button 
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
          activeTool === 'polygon' 
            ? 'bg-pink-500 text-white shadow-md' 
            : 'bg-white text-gray-700 hover:bg-pink-50 border border-gray-300'
        }`}
        onClick={() => handleToolSelect('polygon')}
        title="Draw Polygon"
      >
        <span className="text-lg">⬡</span> Draw Polygon
      </button>

      <button 
        className="px-4 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all flex items-center gap-2 shadow-md"
        onClick={clearAllDrawings}
        title="Clear All"
      >
        <span className="text-lg">🗑️</span> Clear All
      </button>
    </div>
  );

  return (
    <div className={`relative ${fullWidth ? 'h-full w-full' : 'h-full w-full'}`}>
      <MapContainer
        center={center || [14.5995, 120.9842]}
        zoom={zoom || 12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <CachedTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          onCacheHit={handleCacheHit}
          onCacheMiss={handleCacheMiss}
          enableCaching={true}
        />
        <MapCacheControl />
        <LayerManager />
        <GeospatialAnalysis />
        <OfflineStatus />
        <MapInitializer
          setMapRef={setMapRef}
          mapType={mapType}
          center={center}
          zoom={zoom}
          setDrawControl={setDrawControl}
          setMeasureControl={setMeasureControl}
        />
      </MapContainer>
      
      <Toolbar />

      {drawnItems.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[1000] p-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 max-w-xs">
          <h4 className="font-semibold mb-2 text-gray-800">Drawn Items ({drawnItems.length})</h4>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {drawnItems.map(item => (
              <li key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-700">{item.type}: {item.coordinates.length} pts</span>
                <button 
                  className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  onClick={() => {
                    if (mapRef.current && item.layer) {
                      mapRef.current.removeLayer(item.layer);
                      setDrawnItems(prev => prev.filter(i => i.id !== item.id));
                    }
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MapComponent;