import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDriveFolder } from '../utils/api';
import { useApp } from '../context/AppContext';
import { ChevronRight, ChevronDown, Folder, Camera, Image, Search } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import Header from './Header';
import PhotoSwipeGallery from './PhotoSwipeGallery';
import OptimizedImage from './OptimizedImage';
import { preparePhotoSwipeItems, convertToHDUrl } from '../utils/imageUtils';

const PHOTO_ROOT_FOLDER = '1O1WlCjMvZ5lVcrOIGNMlBY4ZuQ-zEarg';

const PhotoDocumentation = () => {
  const { isOnline, showToast, cacheDriveFolderData, getCachedDriveFolderData } = useApp();
  const navigate = useNavigate();
  const [rootFolderData, setRootFolderData] = useState({ folders: [], files: [] });
  const [folderContents, setFolderContents] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [displayedPhotos, setDisplayedPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    loadRootFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize filter function
  const filterImageFiles = useCallback((files) => {
    return (files || []).filter(f => f.mimeType && f.mimeType.startsWith('image/'));
  }, []);

  // Update displayed photos when selection changes
  useEffect(() => {
    if (selectedFolderId && folderContents[selectedFolderId]) {
      setDisplayedPhotos(filterImageFiles(folderContents[selectedFolderId].files));
    } else if (!selectedFolderId) {
      setDisplayedPhotos(filterImageFiles(rootFolderData.files));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootFolderData, selectedFolderId, folderContents]);

  const loadRootFolder = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchDriveFolder(PHOTO_ROOT_FOLDER);
      const folderData = result.data || { folders: [], files: [] };
      setRootFolderData(folderData);
      setDisplayedPhotos(filterImageFiles(folderData.files));
      await cacheDriveFolderData(PHOTO_ROOT_FOLDER, folderData);
    } catch (error) {
      const cached = await getCachedDriveFolderData(PHOTO_ROOT_FOLDER);
      if (cached && cached.data) {
        setRootFolderData(cached.data);
        setDisplayedPhotos(filterImageFiles(cached.data.files));
        showToast('Loaded cached photos', 'info');
      } else {
        showToast('Failed to load photos', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filterImageFiles, cacheDriveFolderData, getCachedDriveFolderData, showToast]);

  const loadFolderContents = async (folderId) => {
    if (folderContents[folderId]) return folderContents[folderId];

    try {
      const result = await fetchDriveFolder(folderId);
      const data = result.data || { folders: [], files: [] };
      setFolderContents(prev => ({ ...prev, [folderId]: data }));
      await cacheDriveFolderData(folderId, data);
      return data;
    } catch (error) {
      const cached = await getCachedDriveFolderData(folderId);
      if (cached && cached.data) {
        setFolderContents(prev => ({ ...prev, [folderId]: cached.data }));
        return cached.data;
      }
      console.error('Failed to load folder contents');
      return { folders: [], files: [] };
    }
  };

  const toggleExpand = async (folderId) => {
    const isCurrentlyExpanded = expandedFolders[folderId];
    
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));

    // Load contents if expanding and not already loaded
    if (!isCurrentlyExpanded && !folderContents[folderId]) {
      await loadFolderContents(folderId);
    }
  };

  const handleFolderClick = async (folderId, folderName) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
    setIsLoading(true);

    try {
      let data;
      if (folderContents[folderId]) {
        data = folderContents[folderId];
      } else {
        data = await loadFolderContents(folderId);
      }
      setDisplayedPhotos(filterImageFiles(data.files));
    } catch (error) {
      showToast('Failed to load folder contents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRootClick = () => {
    setSelectedFolderId(null);
    setSelectedFolderName('');
    setDisplayedPhotos(filterImageFiles(rootFolderData.files));
  };

  // Recursive folder tree component
  const FolderTree = ({ data, level = 0 }) => {
    if (!data?.folders?.length) return null;

    return (
      <div className={`space-y-1 ${level > 0 ? 'ml-4 mt-1 border-l-2 border-gray-200 pl-2' : ''}`}>
        {data.folders.map((folder) => {
          const isExpanded = expandedFolders[folder.id];
          const isSelected = selectedFolderId === folder.id;
          const hasLoadedContents = folderContents[folder.id];
          const hasSubfolders = hasLoadedContents ? folderContents[folder.id].folders?.length > 0 : true;

          return (
            <div key={folder.id}>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(folder.id);
                  }}
                  className="flex items-center justify-center p-1 hover:bg-pink-100 rounded transition-all"
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
                      ? 'bg-pink-100 border-2 border-pink-500' 
                      : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <Folder className={`w-5 h-5 ${isSelected ? 'text-pink-600' : 'text-yellow-500'}`} />
                  <span className={`text-sm font-medium truncate ${isSelected ? 'text-pink-700' : 'text-gray-700'}`}>
                    {folder.name}
                  </span>
                </button>
              </div>
              
              {isExpanded && (
                <div className="ml-4">
                  {folderContents[folder.id] ? (
                    folderContents[folder.id].folders?.length > 0 ? (
                      <FolderTree data={folderContents[folder.id]} level={level + 1} />
                    ) : (
                      <div className="p-2 text-xs text-gray-400 italic">No subfolders</div>
                    )
                  ) : (
                    <div className="p-2 text-xs text-gray-400">Loading...</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Memoized filtered photos with debounce
  const filteredPhotos = useMemo(() => {
    if (!debouncedSearchTerm) {
      return displayedPhotos;
    }
    return displayedPhotos.filter((photo) => 
      photo.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [debouncedSearchTerm, displayedPhotos]);

  // Prepare PhotoSwipe items - memoized
  const photoSwipeItems = useMemo(() => 
    preparePhotoSwipeItems(filteredPhotos, false),
    [filteredPhotos]
  );

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex overflow-hidden bg-gradient-to-b from-pink-50 to-white">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-500" />
                Photos
              </h3>
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Root Folder Button */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={handleRootClick}
              className={`flex items-center gap-2 w-full p-2 rounded-lg transition-all text-left ${
                !selectedFolderId 
                  ? 'bg-pink-100 border-2 border-pink-500' 
                  : 'hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <Folder className={`w-5 h-5 ${!selectedFolderId ? 'text-pink-600' : 'text-yellow-500'}`} />
              <span className={`text-sm font-semibold ${!selectedFolderId ? 'text-pink-700' : 'text-gray-700'}`}>
                All Photos
              </span>
            </button>
          </div>

          {/* Scrollable Folder Tree */}
          <div className="flex-1 overflow-y-auto p-3">
            {rootFolderData.folders?.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No folders found</p>
              </div>
            ) : (
              <FolderTree data={rootFolderData} />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Camera className="w-6 h-6 text-pink-500" />
                Photo Documentation
                {selectedFolderName && (
                  <span className="text-gray-400 font-normal">
                    / {selectedFolderName}
                  </span>
                )}
              </h1>
              {!isOnline && (
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  💾 Offline Mode
                </span>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white border-b border-gray-100 px-6 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading photos...</p>
                </div>
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No photos found</h3>
                  <p className="text-gray-600">Select a folder to view photos</p>
                </div>
              </div>
            ) : (
              <PhotoSwipeGallery 
                galleryID="photo-gallery"
                images={photoSwipeItems}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredPhotos.map((photo, index) => (
                    <a
                      key={photo.id}
                      href={convertToHDUrl(photo.thumbnailLink || photo.webViewLink)}
                      data-pswp-width="2048"
                      data-pswp-height="1536"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                      data-testid={`photo-item-${index}`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                        {photo.thumbnailLink ? (
                          <OptimizedImage
                            src={photo.thumbnailLink}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                            fallback={<div className="text-6xl">🖼️</div>}
                          />
                        ) : (
                          <div className="text-6xl">🖼️</div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-gray-900 text-sm truncate">{photo.name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </PhotoSwipeGallery>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(PhotoDocumentation);
