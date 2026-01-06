import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDriveFolder } from '../utils/api';
import { useApp } from '../context/AppContext';
import { ChevronRight, ChevronDown, Folder, Map, Globe, Mountain, AlertTriangle, TreePine, MapPin, Image } from 'lucide-react';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import OptimizedImage from './OptimizedImage';
import PhotoSwipeGallery from './PhotoSwipeGallery';
import { preparePhotoSwipeItems, convertToHDUrl, convertToMaxHDUrl, isImageFile, isImageMimeType } from '../utils/imageUtils';

// Lazy load heavy components
const MapComponent = lazy(() => import('./MapComponent'));
const PhotoSphereViewer = lazy(() => import('./PhotoSphereViewer'));

const MAP_FOLDERS = {
  interactive: { name: 'Interactive Map', icon: Map, hasSubfolders: false },
  google: { name: 'Google Map', icon: Globe, hasSubfolders: false },
  administrative: { 
    id: '1Wh2wSQuyzHiz25Vbr4ICETj18RRUEpvi', 
    name: 'Administrative Map', 
    icon: Folder,
    hasSubfolders: true, },
  topographic: { id: '1Y01dJR_YJdixvsi_B9Xs7nQaXD31_Yn2', name: 'Topographic Map', icon: Mountain, hasSubfolders: true },
  hazards: { id: '16xy_oUAr6sWb3JE9eNrxYJdAMDRKGYLn', name: 'Hazards Map', icon: AlertTriangle, hasSubfolders: true },
  denr: { id: '1yQmtrKfKiMOFA933W0emzeGoexMpUDGM', name: 'DENR-MGB Map', icon: TreePine, hasSubfolders: true },
  other: { id: '1MI1aO_-gQwsRbSJsfHY2FI4AOz9Jney1', name: 'Other Maps', icon: MapPin, hasSubfolders: true },
  panorama: { id: '1tsbcsTEfg5RLHLJLYXR41avy9SrajsqM', name: 'Panorama', icon: Image, hasSubfolders: false },
};

const MapsViewer = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [currentMapType, setCurrentMapType] = useState('interactive');
  const [selectedSubfolder, setSelectedSubfolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [folderData, setFolderData] = useState({ folders: [], files: [] });
  const [folderContents, setFolderContents] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [displayedFiles, setDisplayedFiles] = useState([]);
  const [selectedPanorama, setSelectedPanorama] = useState(null);

  useEffect(() => {
    loadMaps(currentMapType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMapType]);

  // Update displayed files when folderData or selectedFolderId changes
  useEffect(() => {
    if (selectedFolderId && folderContents[selectedFolderId]) {
      setDisplayedFiles(folderContents[selectedFolderId].files || []);
    } else {
      setDisplayedFiles(folderData.files || []);
    }
  }, [folderData, selectedFolderId, folderContents]);

  const loadMaps = useCallback(async (mapType) => {
    setIsLoading(true);
    const folder = MAP_FOLDERS[mapType];
    if (!folder?.id) {
      setFolderData({ folders: [], files: [] });
      setIsLoading(false);
      return;
    }
    const folderId = folder.id;

    try {
      const result = await fetchDriveFolder(folderId);
      const data = result.data || { folders: [], files: [] };
      setFolderData(data);
    } catch (error) {
      showToast('Failed to load maps', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const loadFolderContents = async (folderId) => {
    if (folderContents[folderId]) return;

    try {
      const result = await fetchDriveFolder(folderId);
      const data = result.data || { folders: [], files: [] };
      setFolderContents(prev => ({ ...prev, [folderId]: data }));
    } catch (error) {
      console.error('Failed to load folder contents');
    }
  };

  const toggleExpand = (key) => {
    setExpandedFolders(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleMapTypeSelect = (key) => {
    setCurrentMapType(key);
    setSelectedSubfolder(null);
    setSelectedFolderId(null);
    setSelectedFolderName('');
    
    // If folder has subfolders, toggle expansion
    const folder = MAP_FOLDERS[key];
    if (folder?.hasSubfolders) {
      const isCurrentlyExpanded = expandedFolders[key];
      toggleExpand(key);
      
      // If the folder has an ID (Drive folder) and it's being expanded, load its contents
      if (folder.id && !isCurrentlyExpanded && !folderData.folders?.length) {
        loadMaps(key);
      }
    }
  };

  const handleFolderClick = async (folderId, folderName) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
    
    // Load folder contents if not already loaded
    if (!folderContents[folderId]) {
      setIsLoading(true);
      try {
        const result = await fetchDriveFolder(folderId);
        const data = result.data || { folders: [], files: [] };
        setFolderContents(prev => ({ ...prev, [folderId]: data }));
        setDisplayedFiles(data.files || []);
      } catch (error) {
        showToast('Failed to load folder contents', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      setDisplayedFiles(folderContents[folderId].files || []);
    }
  };

  const handleSubfolderSelect = (parentKey, subfolderKey) => {
    setCurrentMapType(parentKey);
    setSelectedSubfolder(subfolderKey);
  };

  // Recursive folder tree for Drive folders - ONLY SHOWS FOLDERS IN SIDEBAR
  const FolderTree = ({ data, level = 0, parentKey }) => {
    // Only show if there are folders
    if (!data?.folders?.length) return null;

    return (
      <div className={`space-y-1 ${level > 0 ? 'ml-4 mt-1 border-l-2 border-gray-200 pl-2' : ''}`}>
        {data.folders?.map((folder) => {
          const isExpanded = expandedFolders[folder.id];
          const isSelected = selectedFolderId === folder.id;
          return (
            <div key={folder.id}>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    toggleExpand(folder.id);
                    if (!folderContents[folder.id]) {
                      loadFolderContents(folder.id);
                    }
                  }}
                  className="flex items-center justify-center p-1 hover:bg-gray-200 rounded transition-all"
                >
                  <span className="transition-transform duration-200">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </span>
                </button>
                <button
                  onClick={() => handleFolderClick(folder.id, folder.name)}
                  className={`flex items-center gap-2 flex-1 p-2 rounded-lg transition-all text-left ${
                    isSelected 
                      ? 'bg-teal-100 border-2 border-teal-500' 
                      : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <Folder className={`w-5 h-5 ${isSelected ? 'text-teal-600' : 'text-yellow-500'}`} />
                  <span className={`text-sm font-medium truncate ${isSelected ? 'text-teal-700' : 'text-gray-700'}`}>
                    {folder.name}
                  </span>
                </button>
              </div>
              
              {isExpanded && (
                <div className="ml-4">
                  {folderContents[folder.id] ? (
                    <FolderTree data={folderContents[folder.id]} level={level + 1} parentKey={folder.id} />
                  ) : (
                    <div className="p-2 text-xs text-gray-400">Loading...</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Files are NOT shown in sidebar - they appear in main content only */}
      </div>
    );
  };

  // Sidebar menu item component
  const MenuItem = ({ itemKey, folder, isSelected }) => {
    const IconComponent = folder.icon;
    const isExpanded = expandedFolders[itemKey];
    const hasSubfolders = folder.hasSubfolders;
    const hasDriveFolder = folder.id && !folder.subfolders;

    return (
      <div>
        <button
          onClick={() => handleMapTypeSelect(itemKey)}
          className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all text-left ${
            isSelected && !selectedSubfolder
              ? 'bg-teal-100 border-2 border-teal-500 text-teal-700'
              : 'hover:bg-gray-100 border-2 border-transparent'
          }`}
        >
          {hasSubfolders && (
            <span className="transition-transform duration-200">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </span>
          )}
          <IconComponent className={`w-5 h-5 ${isSelected && !selectedSubfolder ? 'text-teal-600' : 'text-gray-500'}`} />
          <span className={`text-sm font-semibold ${isSelected && !selectedSubfolder ? 'text-teal-700' : 'text-gray-700'}`}>
            {folder.name}
          </span>
        </button>

        {/* Expandable subfolders for predefined subfolders (like Administrative) */}
        {hasSubfolders && isExpanded && folder.subfolders && (
          <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
            {folder.subfolders.map((subfolder) => {
              const SubIcon = subfolder.icon;
              const isSubSelected = isSelected && selectedSubfolder === subfolder.key;
              
              return (
                <button
                  key={subfolder.key}
                  onClick={() => handleSubfolderSelect(itemKey, subfolder.key)}
                  className={`flex items-center gap-2 w-full p-2 rounded-lg transition-all text-left ${
                    isSubSelected
                      ? 'bg-teal-100 border-2 border-teal-500 text-teal-700'
                      : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <SubIcon className={`w-4 h-4 ${isSubSelected ? 'text-teal-600' : 'text-yellow-500'}`} />
                  <span className={`text-sm ${isSubSelected ? 'font-semibold text-teal-700' : 'text-gray-600'}`}>
                    {subfolder.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Drive folder tree for maps with Drive folders (Topographic, Hazards, DENR, Others) */}
        {hasSubfolders && isExpanded && hasDriveFolder && isSelected && (
          <div className="ml-6 mt-1 border-l-2 border-gray-200 pl-2">
            {isLoading ? (
              <div className="p-2 text-xs text-gray-400">Loading folders...</div>
            ) : folderData.folders?.length > 0 || folderData.files?.length > 0 ? (
              <FolderTree data={folderData} />
            ) : (
              <div className="p-2 text-xs text-gray-400">No subfolders</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const isInteractiveMap = currentMapType === 'interactive' || currentMapType === 'google';

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden bg-gradient-to-b from-teal-50 to-white">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Map className="w-5 h-5 text-teal-500" />
                Maps
              </h3>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Scrollable Menu */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {Object.entries(MAP_FOLDERS).map(([key, folder]) => (
              <MenuItem 
                key={key}
                itemKey={key}
                folder={folder}
                isSelected={currentMapType === key}
              />
            ))}
          </div>
        </div>

        {/* Main Content - Full Width Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {React.createElement(MAP_FOLDERS[currentMapType]?.icon || Map, { className: "w-6 h-6 text-teal-500" })}
              {MAP_FOLDERS[currentMapType]?.name || 'Map'}
              {selectedFolderName && (
                <span className="text-gray-400 font-normal">
                  / {selectedFolderName}
                </span>
              )}
              {selectedSubfolder && !selectedFolderName && (
                <span className="text-gray-400 font-normal">
                  / {MAP_FOLDERS[currentMapType]?.subfolders?.find(s => s.key === selectedSubfolder)?.name}
                </span>
              )}
            </h1>
          </div>

          {/* Map Container - Full Width */}
          <div className="flex-1 overflow-hidden">
            {isInteractiveMap ? (
              <div className="h-full w-full">
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <MapComponent
                    mapType={currentMapType}
                    center={[13.0485, 123.4567]}
                    zoom={13}
                    fullWidth={true}
                  />
                </Suspense>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading maps...</p>
                </div>
              </div>
            ) : displayedFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No maps found</h3>
                  <p className="text-gray-600">This folder is empty</p>
                </div>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto h-full">
                {/* Check if it's panorama - use PhotoSphereViewer */}
                {currentMapType === 'panorama' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedFiles.map((map) => (
                      <button
                        key={map.id}
                        onClick={() => setSelectedPanorama({
                          url: convertToMaxHDUrl(map.thumbnailLink || map.webViewLink),
                          title: map.name
                        })}
                        className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                        data-testid={`panorama-${map.id}`}
                      >
                        <div className="aspect-video bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center relative">
                          {map.thumbnailLink ? (
                            <OptimizedImage
                              src={map.thumbnailLink}
                              alt={map.name}
                              className="w-full h-full object-cover"
                              fallback={<Map className="w-12 h-12 text-white" />}
                            />
                          ) : (
                            <Map className="w-12 h-12 text-white" />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <div className="text-white text-5xl opacity-0 hover:opacity-100 transition-opacity">
                              360°
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-gray-900 text-sm truncate">{map.name}</p>
                          <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            Click to view 360° panorama
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Use PhotoSwipe for other map types */
                  (() => {
                    const imageFiles = displayedFiles.filter(file => 
                      isImageFile(file.name) || isImageMimeType(file.mimeType)
                    );
                    const nonImageFiles = displayedFiles.filter(file => 
                      !isImageFile(file.name) && !isImageMimeType(file.mimeType)
                    );
                    const photoSwipeItems = preparePhotoSwipeItems(imageFiles, false);
                    
                    return (
                      <PhotoSwipeGallery 
                        galleryID={`map-gallery-${currentMapType}`}
                        images={photoSwipeItems}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {/* Render image files with PhotoSwipe */}
                          {imageFiles.map((map, index) => (
                            <a
                              key={map.id}
                              href={convertToHDUrl(map.thumbnailLink || map.webViewLink)}
                              data-pswp-width="2048"
                              data-pswp-height="1536"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                              data-testid={`map-image-${index}`}
                            >
                              <div className="aspect-video bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                                {map.thumbnailLink ? (
                                  <img
                                    src={map.thumbnailLink}
                                    alt={map.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Map className="w-12 h-12 text-white" />
                                )}
                              </div>
                              <div className="p-4">
                                <p className="font-semibold text-gray-900 text-sm truncate">{map.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Click to view full map</p>
                              </div>
                            </a>
                          ))}
                          
                          {/* Render non-image files (PDFs, etc.) without PhotoSwipe */}
                          {nonImageFiles.map((map) => (
                            <a
                              key={map.id}
                              href={map.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                              data-testid={`map-file-${map.id}`}
                            >
                              <div className="aspect-video bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                                {map.thumbnailLink ? (
                                  <img
                                    src={map.thumbnailLink}
                                    alt={map.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Map className="w-12 h-12 text-white" />
                                )}
                              </div>
                              <div className="p-4">
                                <p className="font-semibold text-gray-900 text-sm truncate">{map.name}</p>
                                <p className="text-xs text-gray-500 mt-1">Click to view full map</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </PhotoSwipeGallery>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Photo Sphere Viewer Modal */}
      {selectedPanorama && (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <PhotoSphereViewer
            imageUrl={selectedPanorama.url}
            title={selectedPanorama.title}
            onClose={() => setSelectedPanorama(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default memo(MapsViewer);