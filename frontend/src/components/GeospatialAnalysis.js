import React, { useState, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Calculator,
  Target,
  Move,
  Zap,
  Circle,
  Square,
  Minus,
  MapPin,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  calculateDistance,
  calculateArea,
  calculatePerimeter,
  createPointBuffer,
  createLineBuffer,
  pointInPolygon,
  lineIntersection,
  calculateCentroid,
  formatDistance,
  formatArea
} from '../utils/geospatialAnalysis';
import { geospatialStorage, offlineQueue } from '../utils/offlineStorage';

const GeospatialAnalysis = ({ position = 'topleft' }) => {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [bufferDistance, setBufferDistance] = useState(100);
  const [analysisLayers, setAnalysisLayers] = useState([]);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved analyses on component mount
  useEffect(() => {
    loadSavedAnalyses();
  }, []);

  // Get available layers for analysis
  useEffect(() => {
    if (!map) return;

    const updateAvailableLayers = () => {
      const layers = [];

      map.eachLayer((layer) => {
        let layerInfo = null;

        if (layer instanceof L.Marker) {
          layerInfo = {
            id: `marker-${Date.now()}`,
            name: 'Point',
            layer: layer,
            type: 'point',
            coordinates: layer.getLatLng()
          };
        } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          layerInfo = {
            id: `line-${Date.now()}`,
            name: 'Line',
            layer: layer,
            type: 'line',
            coordinates: layer.getLatLngs()
          };
        } else if (layer instanceof L.Polygon) {
          layerInfo = {
            id: `polygon-${Date.now()}`,
            name: 'Polygon',
            layer: layer,
            type: 'polygon',
            coordinates: layer.getLatLngs()
          };
        }

        if (layerInfo) {
          layers.push(layerInfo);
        }
      });

      setSelectedLayers(layers);
    };

    updateAvailableLayers();

    map.on('layeradd', updateAvailableLayers);
    map.on('layerremove', updateAvailableLayers);

    return () => {
      map.off('layeradd', updateAvailableLayers);
      map.off('layerremove', updateAvailableLayers);
    };
  }, [map]);

  // Load saved analyses from offline storage
  const loadSavedAnalyses = async () => {
    try {
      const savedData = await geospatialStorage.getByType('analysis-result');
      setSavedAnalyses(savedData);
    } catch (error) {
      console.error('Failed to load saved analyses:', error);
    }
  };

  // Save analysis result to offline storage
  const saveAnalysisResult = async (result) => {
    try {
      const analysisData = {
        type: 'analysis-result',
        result: result,
        layers: selectedLayers.map(l => ({
          type: l.type,
          coordinates: l.coordinates
        })),
        timestamp: Date.now(),
        synced: false
      };

      await geospatialStorage.save(analysisData);
      await loadSavedAnalyses(); // Refresh the list
    } catch (error) {
      console.error('Failed to save analysis result:', error);
    }
  };

  // Clear analysis results
  const clearAnalysisResults = useCallback(() => {
    // Remove analysis layers from map
    analysisLayers.forEach(layer => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    setAnalysisLayers([]);
    setAnalysisResults({});
  }, [map, analysisLayers]);

  // Calculate distance between two points
  const performDistanceAnalysis = useCallback(async () => {
    if (selectedLayers.length < 2) return;

    const points = selectedLayers.filter(l => l.type === 'point');
    if (points.length < 2) return;

    const distance = calculateDistance(points[0].coordinates, points[1].coordinates);
    const result = {
      type: 'distance',
      result: formatDistance(distance),
      rawValue: distance,
      description: `Distance between ${points.length} points`
    };

    setAnalysisResults(result);
    await saveAnalysisResult(result);
  }, [selectedLayers, saveAnalysisResult]);

  // Calculate area of polygon
  const performAreaAnalysis = useCallback(() => {
    const polygons = selectedLayers.filter(l => l.type === 'polygon');
    if (polygons.length === 0) return;

    const polygon = polygons[0];
    const area = calculateArea(polygon.coordinates[0] || polygon.coordinates);

    setAnalysisResults({
      type: 'area',
      result: formatArea(area),
      rawValue: area
    });
  }, [selectedLayers]);

  // Calculate perimeter/length
  const performPerimeterAnalysis = useCallback(() => {
    const lines = selectedLayers.filter(l => l.type === 'line');
    const polygons = selectedLayers.filter(l => l.type === 'polygon');

    let result = null;
    let length = 0;

    if (lines.length > 0) {
      length = calculatePerimeter(lines[0].coordinates[0] || lines[0].coordinates, false);
      result = {
        type: 'length',
        result: formatDistance(length),
        rawValue: length
      };
    } else if (polygons.length > 0) {
      length = calculatePerimeter(polygons[0].coordinates[0] || polygons[0].coordinates, true);
      result = {
        type: 'perimeter',
        result: formatDistance(length),
        rawValue: length
      };
    }

    if (result) {
      setAnalysisResults(result);
    }
  }, [selectedLayers]);

  // Create buffer around selected features
  const performBufferAnalysis = useCallback(() => {
    if (selectedLayers.length === 0 || bufferDistance <= 0) return;

    clearAnalysisResults();

    selectedLayers.forEach(layerInfo => {
      let bufferLayer = null;

      if (layerInfo.type === 'point') {
        const bufferPoints = createPointBuffer(layerInfo.coordinates, bufferDistance);
        bufferLayer = L.polygon(bufferPoints, {
          color: 'red',
          fillColor: 'red',
          fillOpacity: 0.2,
          weight: 2
        });
      } else if (layerInfo.type === 'line') {
        const coords = layerInfo.coordinates[0] || layerInfo.coordinates;
        const bufferPoints = createLineBuffer(coords, bufferDistance);
        bufferLayer = L.polygon(bufferPoints, {
          color: 'orange',
          fillColor: 'orange',
          fillOpacity: 0.2,
          weight: 2
        });
      }

      if (bufferLayer) {
        bufferLayer.addTo(map);
        setAnalysisLayers(prev => [...prev, bufferLayer]);
      }
    });

    setAnalysisResults({
      type: 'buffer',
      result: `Created ${bufferDistance}m buffer around ${selectedLayers.length} feature(s)`
    });
  }, [selectedLayers, bufferDistance, map, clearAnalysisResults]);

  // Find intersections between lines
  const performIntersectionAnalysis = useCallback(() => {
    const lines = selectedLayers.filter(l => l.type === 'line');
    if (lines.length < 2) return;

    clearAnalysisResults();

    const intersections = [];
    for (let i = 0; i < lines.length - 1; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const line1Coords = lines[i].coordinates[0] || lines[i].coordinates;
        const line2Coords = lines[j].coordinates[0] || lines[j].coordinates;

        const lineIntersections = lineIntersection(line1Coords, line2Coords);
        intersections.push(...lineIntersections);
      }
    }

    // Add intersection markers
    intersections.forEach(intersection => {
      const marker = L.marker(intersection, {
        icon: L.divIcon({
          className: 'intersection-marker',
          html: '⚡',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);
      setAnalysisLayers(prev => [...prev, marker]);
    });

    setAnalysisResults({
      type: 'intersection',
      result: `Found ${intersections.length} intersection(s)`
    });
  }, [selectedLayers, map, clearAnalysisResults]);

  // Calculate centroid
  const performCentroidAnalysis = useCallback(() => {
    const polygons = selectedLayers.filter(l => l.type === 'polygon');
    if (polygons.length === 0) return;

    clearAnalysisResults();

    polygons.forEach(polygon => {
      const coords = polygon.coordinates[0] || polygon.coordinates;
      const centroid = calculateCentroid(coords);

      if (centroid) {
        const marker = L.marker(centroid, {
          icon: L.divIcon({
            className: 'centroid-marker',
            html: '⊕',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);
        setAnalysisLayers(prev => [...prev, marker]);
      }
    });

    setAnalysisResults({
      type: 'centroid',
      result: `Calculated centroid(s) for ${polygons.length} polygon(s)`
    });
  }, [selectedLayers, map, clearAnalysisResults]);

  // Point in polygon test
  const performPointInPolygonAnalysis = useCallback(() => {
    const points = selectedLayers.filter(l => l.type === 'point');
    const polygons = selectedLayers.filter(l => l.type === 'polygon');

    if (points.length === 0 || polygons.length === 0) return;

    clearAnalysisResults();

    let insideCount = 0;
    points.forEach(point => {
      polygons.forEach(polygon => {
        const coords = polygon.coordinates[0] || polygon.coordinates;
        if (pointInPolygon(point.coordinates, coords)) {
          insideCount++;
          // Mark point as inside
          const marker = L.marker(point.coordinates, {
            icon: L.divIcon({
              className: 'inside-marker',
              html: '✓',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(map);
          setAnalysisLayers(prev => [...prev, marker]);
        }
      });
    });

    setAnalysisResults({
      type: 'point-in-polygon',
      result: `${insideCount} point(s) found inside polygon(s)`
    });
  }, [selectedLayers, map, clearAnalysisResults]);

  const analysisTools = [
    {
      id: 'distance',
      name: 'Distance',
      icon: <Move className="w-4 h-4" />,
      description: 'Calculate distance between two points',
      action: performDistanceAnalysis,
      requires: ['point']
    },
    {
      id: 'area',
      name: 'Area',
      icon: <Square className="w-4 h-4" />,
      description: 'Calculate area of polygon',
      action: performAreaAnalysis,
      requires: ['polygon']
    },
    {
      id: 'perimeter',
      name: 'Perimeter/Length',
      icon: <Minus className="w-4 h-4" />,
      description: 'Calculate perimeter or length',
      action: performPerimeterAnalysis,
      requires: ['line', 'polygon']
    },
    {
      id: 'buffer',
      name: 'Buffer',
      icon: <Circle className="w-4 h-4" />,
      description: 'Create buffer around features',
      action: performBufferAnalysis,
      requires: ['point', 'line']
    },
    {
      id: 'intersection',
      name: 'Intersections',
      icon: <Zap className="w-4 h-4" />,
      description: 'Find line intersections',
      action: performIntersectionAnalysis,
      requires: ['line']
    },
    {
      id: 'centroid',
      name: 'Centroid',
      icon: <Target className="w-4 h-4" />,
      description: 'Calculate polygon centroids',
      action: performCentroidAnalysis,
      requires: ['polygon']
    },
    {
      id: 'point-in-polygon',
      name: 'Point in Polygon',
      icon: <MapPin className="w-4 h-4" />,
      description: 'Test if points are inside polygons',
      action: performPointInPolygonAnalysis,
      requires: ['point', 'polygon']
    }
  ];

  const getLayerIcon = (type) => {
    switch (type) {
      case 'point': return '📍';
      case 'line': return '✏️';
      case 'polygon': return '⬡';
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
          title="Geospatial Analysis"
        >
          <Calculator className="w-4 h-4" />
          <span className="text-sm font-medium">Analysis</span>
        </button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div
          className={`absolute ${
            position.includes('bottom') ? 'bottom-16' : 'top-16'
          } ${
            position.includes('left') ? 'left-4' : 'right-4'
          } z-[1001] w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[500px]`}
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                <h3 className="font-bold">Geospatial Analysis</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            <Tabs defaultValue="tools" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="saved">Saved ({savedAnalyses.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="tools" className="space-y-3">
                {/* Analysis Tools */}
                <div className="grid grid-cols-2 gap-2">
                  {analysisTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveAnalysis(tool.id);
                        tool.action();
                      }}
                      className={`p-3 rounded-lg border text-left hover:bg-gray-50 transition-colors ${
                        activeAnalysis === tool.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                      title={tool.description}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {tool.icon}
                        <span className="font-medium text-sm">{tool.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{tool.description}</p>
                    </button>
                  ))}
                </div>

                {/* Buffer Distance Input */}
                {activeAnalysis === 'buffer' && (
                  <div className="space-y-2">
                    <Label htmlFor="buffer-distance">Buffer Distance (meters)</Label>
                    <Input
                      id="buffer-distance"
                      type="number"
                      value={bufferDistance}
                      onChange={(e) => setBufferDistance(Number(e.target.value))}
                      min="1"
                      max="10000"
                    />
                  </div>
                )}

                {/* Analysis Results */}
                {analysisResults.type && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Analysis Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{analysisResults.result}</p>
                      {analysisResults.rawValue && (
                        <p className="text-xs text-gray-500 mt-1">
                          Raw value: {analysisResults.rawValue.toFixed(2)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Clear Results */}
                {(analysisLayers.length > 0 || Object.keys(analysisResults).length > 0) && (
                  <Button
                    onClick={clearAnalysisResults}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Clear Analysis Results
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="layers" className="space-y-3">
                <div className="text-sm text-gray-600 mb-2">
                  Select layers to analyze ({selectedLayers.length} available)
                </div>

                {selectedLayers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No layers available for analysis</p>
                    <p className="text-xs">Draw some features on the map first</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedLayers.map(layer => (
                      <div
                        key={layer.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getLayerIcon(layer.type)}</span>
                          <span className="text-sm font-medium">{layer.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{layer.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="space-y-3">
                <div className="text-sm text-gray-600">
                  Previously saved analysis results ({savedAnalyses.length})
                </div>

                {savedAnalyses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No saved analyses yet</p>
                    <p className="text-xs">Run some analyses to see them saved here</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {savedAnalyses.map((analysis, index) => (
                      <Card key={analysis.id || index} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium capitalize">
                                {analysis.result?.type || 'Analysis'}
                              </span>
                              {!analysis.synced && (
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                                  Not synced
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">
                              {analysis.result?.result || analysis.result}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(analysis.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {savedAnalyses.length > 0 && (
                  <Button
                    onClick={async () => {
                      if (window.confirm('Clear all saved analyses? This cannot be undone.')) {
                        // This would need to be implemented in offlineStorage
                        setSavedAnalyses([]);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Clear All Saved
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </>
  );
};

export default GeospatialAnalysis;