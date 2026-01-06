import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCw, Move, RefreshCw, Pause, Play } from 'lucide-react';

// Import photo-sphere-viewer v5 and its CSS
import { Viewer } from '@photo-sphere-viewer/core';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import '@photo-sphere-viewer/core/index.css';

const PhotoSphereViewer = ({ imageUrl, title, onClose }) => {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const autorotatePluginRef = useRef(null);
  const [viewer, setViewer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true); // Start with auto-rotate enabled
  const [isFullscreen, setIsFullscreen] = useState(false);

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !imageUrl) return;

    // Cleanup previous viewer instance
    if (viewerRef.current) {
      try {
        viewerRef.current.destroy();
        viewerRef.current = null;
        autorotatePluginRef.current = null;
      } catch (e) {
        console.error('Error destroying previous viewer:', e);
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if container still exists after delay
      if (!containerRef.current) {
        throw new Error('Container not available');
      }

      console.log('Initializing Photo Sphere Viewer with URL:', imageUrl);

      // Initialize Photo Sphere Viewer v5 with AutorotatePlugin
      const viewerInstance = new Viewer({
        container: containerRef.current,
        panorama: imageUrl,
        navbar: false, // We use custom controls
        defaultZoomLvl: 50,
        minFov: 30,
        maxFov: 90,
        loadingTxt: 'Loading panorama...',
        mousewheel: true,
        mousemove: true,
        keyboard: 'always',
        touchmoveTwoFingers: false,
        defaultPitch: 0,
        defaultYaw: 0,
        fisheye: 0,
        moveSpeed: 1,
        zoomSpeed: 1,
        plugins: [
          [AutorotatePlugin, {
            autorotateSpeed: '1rpm', // Rotation speed (1 revolution per minute)
            autorotatePitch: 0, // Keep horizontal
            autostartDelay: 1000, // Start auto-rotate after 1 second of inactivity
            autostartOnIdle: true, // Auto-start when user stops interacting
          }],
        ],
      });

      // Get the autorotate plugin instance
      const autorotatePlugin = viewerInstance.getPlugin(AutorotatePlugin);
      autorotatePluginRef.current = autorotatePlugin;

      // Event listeners for v5 API
      viewerInstance.addEventListener('ready', () => {
        setIsLoading(false);
        console.log('Photo Sphere Viewer is ready');
        
        // Start auto-rotate automatically when ready
        if (autorotatePlugin) {
          autorotatePlugin.start();
          setIsAutoRotating(true);
        }
      });

      viewerInstance.addEventListener('load-progress', (e) => {
        console.log('Loading progress:', e.progress);
      });

      viewerInstance.addEventListener('click', (e) => {
        console.log('Viewer clicked', e.data);
      });

      // Listen for fullscreen changes
      viewerInstance.addEventListener('fullscreen', (e) => {
        setIsFullscreen(e.fullscreenEnabled);
      });

      setViewer(viewerInstance);
      viewerRef.current = viewerInstance;

      // Set timeout to handle cases where ready event doesn't fire
      setTimeout(() => {
        if (viewerRef.current) {
          setIsLoading(false);
        }
      }, 5000);

    } catch (err) {
      console.error('Failed to initialize viewer:', err);
      setError(`Failed to initialize viewer: ${err.message}`);
      setIsLoading(false);
    }
  }, [imageUrl]);

  useEffect(() => {
    initViewer();

    // Cleanup function
    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
          viewerRef.current = null;
          autorotatePluginRef.current = null;
        } catch (e) {
          console.error('Error destroying viewer:', e);
        }
      }
    };
  }, [imageUrl, retryCount, initViewer]);

  // Listen for fullscreen changes from browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleZoomIn = () => {
    if (viewer) {
      const currentZoom = viewer.getZoomLevel();
      viewer.zoom(Math.min(currentZoom + 10, 100));
    }
  };

  const handleZoomOut = () => {
    if (viewer) {
      const currentZoom = viewer.getZoomLevel();
      viewer.zoom(Math.max(currentZoom - 10, 0));
    }
  };

  const handleFullscreen = () => {
    if (viewer) {
      viewer.toggleFullscreen();
    }
  };

  const handleAutoRotate = () => {
    const plugin = autorotatePluginRef.current;
    if (plugin) {
      if (isAutoRotating) {
        plugin.stop();
        setIsAutoRotating(false);
      } else {
        plugin.start();
        setIsAutoRotating(true);
      }
    }
  };

  const handleResetView = () => {
    if (viewer) {
      viewer.rotate({ yaw: 0, pitch: 0 });
      viewer.zoom(50);
    }
  };

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold truncate max-w-md" title={title}>
            {title}
          </h2>
          <span className="text-sm text-gray-400">360° Panorama View</span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Zoom In"
            data-testid="zoom-in-btn"
            disabled={!viewer}
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Zoom Out"
            data-testid="zoom-out-btn"
            disabled={!viewer}
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-1"></div>
          <button
            onClick={handleAutoRotate}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              isAutoRotating 
                ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                : 'hover:bg-gray-800 text-gray-300'
            }`}
            title={isAutoRotating ? "Stop Auto Rotate" : "Start Auto Rotate"}
            data-testid="auto-rotate-btn"
            disabled={!viewer}
          >
            {isAutoRotating ? (
              <>
                <Pause className="w-4 h-4" />
                <RotateCw className="w-4 h-4 animate-spin" />
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <RotateCw className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            onClick={handleResetView}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Reset View"
            data-testid="reset-view-btn"
            disabled={!viewer}
          >
            <Move className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-1"></div>
          <button
            onClick={handleFullscreen}
            className={`p-2 rounded-lg transition-colors ${
              isFullscreen 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'hover:bg-gray-800 text-gray-300'
            }`}
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
            data-testid="fullscreen-btn"
            disabled={!viewer}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
          <div className="w-px h-6 bg-gray-600 mx-2"></div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-600 rounded-lg transition-colors"
            title="Close (ESC)"
            data-testid="close-panorama-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Viewer Container */}
      <div className="flex-1 relative">
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Loading panorama...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center max-w-md">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className="text-white text-lg mb-2">Failed to load panorama</p>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div 
          ref={containerRef} 
          className="w-full h-full"
          style={{ minHeight: '400px' }}
          data-testid="photo-sphere-container"
        />
      </div>

      {/* Instructions */}
      <div className="bg-gray-900 text-gray-400 px-6 py-3 text-sm border-t border-gray-700">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <span>🖱️ Drag to look around</span>
          <span>🔍 Scroll to zoom</span>
          <span>⌨️ Arrow keys to navigate</span>
          <span className="text-teal-400">🔄 Auto-rotate {isAutoRotating ? 'ON' : 'OFF'}</span>
          <span className="text-blue-400">⛶ {isFullscreen ? 'Fullscreen Mode' : 'Press F11 or click fullscreen'}</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default PhotoSphereViewer;
