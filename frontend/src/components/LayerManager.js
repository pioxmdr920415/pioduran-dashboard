import React, { useState, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Eye,
  EyeOff,
  Settings,
  Trash2,
  Plus,
  Download,
  Upload,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

const LayerManager = ({ position = 'topright' }) => {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const [layerGroups, setLayerGroups] = useState({
    base: {
      id: 'base',
      name: 'Base Layers',
      expanded: true,
      layers: []
    },
    overlays: {
      id: 'overlays',
      name: 'Overlay Layers',
      expanded: true,
      layers: []
    },
    analysis: {
      id: 'analysis',
      name: 'Analysis Layers',
      expanded: true,
      layers: []
    }
  });

  // Initialize layer groups when map is ready
  useEffect(() => {
    if (!map) return;

    const updateLayerGroups = () => {
      const newLayerGroups = { ...layerGroups };

      // Get all layers from map
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          // Base layer
          newLayerGroups.base.layers = [{
            id: 'base-tile',
            name: 'OpenStreetMap',
            layer: layer,
            visible: map.hasLayer(layer),
            opacity: layer.options.opacity || 1,
            type: 'tile'
          }];
        } else if (layer instanceof L.Marker) {
          // Marker overlay
          const markerLayer = {
            id: `marker-${Date.now()}`,
            name: 'Marker',
            layer: layer,
            visible: map.hasLayer(layer),
            opacity: 1,
            type: 'marker'
          };
          newLayerGroups.overlays.layers.push(markerLayer);
        } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          // Polyline overlay
          const lineLayer = {
            id: `line-${Date.now()}`,
            name: 'Line',
            layer: layer,
            visible: map.hasLayer(layer),
            opacity: layer.options.opacity || 1,
            type: 'polyline'
          };
          newLayerGroups.overlays.layers.push(lineLayer);
        } else if (layer instanceof L.Polygon) {
          // Polygon overlay
          const polygonLayer = {
            id: `polygon-${Date.now()}`,
            name: 'Polygon',
            layer: layer,
            visible: map.hasLayer(layer),
            opacity: layer.options.opacity || 1,
            type: 'polygon'
          };
          newLayerGroups.overlays.layers.push(polygonLayer);
        }
      });

      setLayerGroups(newLayerGroups);
    };

    updateLayerGroups();

    // Listen for layer add/remove events
    map.on('layeradd', updateLayerGroups);
    map.on('layerremove', updateLayerGroups);

    return () => {
      map.off('layeradd', updateLayerGroups);
      map.off('layerremove', updateLayerGroups);
    };
  }, [map]);

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((groupId, layerId) => {
    setLayerGroups(prev => {
      const newGroups = { ...prev };
      const layer = newGroups[groupId].layers.find(l => l.id === layerId);

      if (layer) {
        layer.visible = !layer.visible;

        if (layer.visible) {
          if (!map.hasLayer(layer.layer)) {
            map.addLayer(layer.layer);
          }
        } else {
          if (map.hasLayer(layer.layer)) {
            map.removeLayer(layer.layer);
          }
        }
      }

      return newGroups;
    });
  }, [map]);

  // Update layer opacity
  const updateLayerOpacity = useCallback((groupId, layerId, opacity) => {
    setLayerGroups(prev => {
      const newGroups = { ...prev };
      const layer = newGroups[groupId].layers.find(l => l.id === layerId);

      if (layer) {
        layer.opacity = opacity;
        if (layer.layer.setOpacity) {
          layer.layer.setOpacity(opacity);
        }
      }

      return newGroups;
    });
  }, []);

  // Remove layer
  const removeLayer = useCallback((groupId, layerId) => {
    setLayerGroups(prev => {
      const newGroups = { ...prev };
      const layerIndex = newGroups[groupId].layers.findIndex(l => l.id === layerId);

      if (layerIndex !== -1) {
        const layer = newGroups[groupId].layers[layerIndex];
        if (map.hasLayer(layer.layer)) {
          map.removeLayer(layer.layer);
        }
        newGroups[groupId].layers.splice(layerIndex, 1);
      }

      return newGroups;
    });
  }, [map]);

  // Toggle group expansion
  const toggleGroupExpansion = useCallback((groupId) => {
    setLayerGroups(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        expanded: !prev[groupId].expanded
      }
    }));
  }, []);

  // Export layers as GeoJSON
  const exportLayers = useCallback(() => {
    const geoJson = {
      type: 'FeatureCollection',
      features: []
    };

    Object.values(layerGroups).forEach(group => {
      group.layers.forEach(layerItem => {
        if (layerItem.visible && layerItem.layer) {
          let geometry = null;
          let properties = {
            name: layerItem.name,
            type: layerItem.type,
            opacity: layerItem.opacity
          };

          if (layerItem.type === 'marker' && layerItem.layer.getLatLng) {
            geometry = {
              type: 'Point',
              coordinates: [layerItem.layer.getLatLng().lng, layerItem.layer.getLatLng().lat]
            };
          } else if ((layerItem.type === 'polyline' || layerItem.type === 'polygon') && layerItem.layer.getLatLngs) {
            const coords = layerItem.layer.getLatLngs();
            if (layerItem.type === 'polygon') {
              geometry = {
                type: 'Polygon',
                coordinates: [coords.map(latlng => [latlng.lng, latlng.lat])]
              };
            } else {
              geometry = {
                type: 'LineString',
                coordinates: coords.map(latlng => [latlng.lng, latlng.lat])
              };
            }
          }

          if (geometry) {
            geoJson.features.push({
              type: 'Feature',
              geometry,
              properties
            });
          }
        }
      });
    });

    const dataStr = JSON.stringify(geoJson, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = 'map-layers.geojson';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [layerGroups]);

  // Get layer icon based on type
  const getLayerIcon = (type) => {
    switch (type) {
      case 'marker': return '📍';
      case 'polyline': return '✏️';
      case 'polygon': return '⬡';
      case 'tile': return '🗺️';
      default: return '📄';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <div
        className={`leaflet-control leaflet-bar absolute ${
          position.includes('bottom') ? 'bottom-4' : 'top-4'
        } ${
          position.includes('left') ? 'left-4' : 'right-4'
        } z-[1000]`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          title="Layer Manager"
        >
          <Layers className="w-4 h-4" />
          <span className="text-sm font-medium">Layers</span>
        </button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div
          className={`absolute ${
            position.includes('bottom') ? 'bottom-16' : 'top-16'
          } ${
            position.includes('left') ? 'left-4' : 'right-4'
          } z-[1001] w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-96`}
        >
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <h3 className="font-bold">Layer Manager</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportLayers}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  title="Export Layers"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {Object.values(layerGroups).map(group => (
              <Collapsible key={group.id} open={group.expanded} onOpenChange={() => toggleGroupExpansion(group.id)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    {group.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-medium text-gray-700">{group.name}</span>
                    <span className="text-xs text-gray-500">({group.layers.length})</span>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-2 mt-2">
                  {group.layers.length === 0 ? (
                    <div className="text-sm text-gray-500 italic p-2">
                      No layers in this group
                    </div>
                  ) : (
                    group.layers.map(layer => (
                      <div key={layer.id} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getLayerIcon(layer.type)}</span>
                            <span className="font-medium text-gray-700">{layer.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleLayerVisibility(group.id, layer.id)}
                              className={`p-1 rounded transition-colors ${
                                layer.visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                              }`}
                              title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                            >
                              {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => removeLayer(group.id, layer.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove Layer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Opacity Control */}
                        {layer.type !== 'marker' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>Opacity</span>
                              <span>{Math.round(layer.opacity * 100)}%</span>
                            </div>
                            <Slider
                              value={[layer.opacity * 100]}
                              onValueChange={([value]) => updateLayerOpacity(group.id, layer.id, value / 100)}
                              max={100}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default LayerManager;