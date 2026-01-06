import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDriveFolder } from '../utils/api';
import { useApp } from '../context/AppContext';
import { ChevronRight, ChevronDown, Folder, FileText, File, Search, X, ExternalLink, Maximize2, Download } from 'lucide-react';
import Header from './Header';
import PhotoSwipeGallery from './PhotoSwipeGallery';
import { preparePhotoSwipeItems, convertToHDUrl, isImageFile, isImageMimeType } from '../utils/imageUtils';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';

const DOCUMENT_ROOT_FOLDER = '15_xiFeXu_vdIe2CYrjGaRCAho2OqhGvo';

// Helper to get Google Drive export/preview URL based on file type
const getGoogleDriveViewUrl = (file) => {
  const fileId = file.id;
  const mimeType = file.mimeType || '';
  
  // For Google Docs/Sheets/Slides, use export URLs
  if (mimeType === 'application/vnd.google-apps.document') {
    return `https://docs.google.com/document/d/${fileId}/preview`;
  }
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
  }
  if (mimeType === 'application/vnd.google-apps.presentation') {
    return `https://docs.google.com/presentation/d/${fileId}/preview`;
  }
  
  // For regular files (PDF, DOCX, etc.), use Google Docs Viewer
  // This is the most reliable way to view Google Drive files
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

// Check if file can be viewed with Google Drive viewer
const isViewableFile = (file) => {
  const mimeType = file.mimeType || '';
  const viewableMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/msword', // doc
    'application/vnd.ms-excel', // xls
    'application/vnd.ms-powerpoint', // ppt
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'text/plain',
    'text/csv',
  ];
  return viewableMimeTypes.includes(mimeType);
};

// Document Viewer Modal Component
const DocumentViewerModal = ({ file, onClose }) => {
  const [viewerType, setViewerType] = useState('google'); // 'google' or 'native'
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        onClose();
      }
    }
  }, [isFullscreen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown]);

  if (!file) return null;

  const googleViewUrl = getGoogleDriveViewUrl(file);
  
  // For native viewer, try to get a direct download URL
  const nativeViewerDocs = file.webContentLink 
    ? [{ uri: file.webContentLink, fileName: file.name }]
    : [{ uri: `https://drive.google.com/uc?export=download&id=${file.id}`, fileName: file.name }];

  return (
    <div 
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 ${isFullscreen ? 'p-0' : 'p-4'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="document-viewer-modal"
    >
      <div className={`bg-white rounded-xl shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl">{getFileIconEmoji(file.mimeType)}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-gray-500">{getFileTypeLabel(file.mimeType)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Viewer Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
              <button
                onClick={() => setViewerType('google')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewerType === 'google' 
                    ? 'bg-white text-amber-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="viewer-toggle-google"
              >
                Google Viewer
              </button>
              <button
                onClick={() => setViewerType('native')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewerType === 'native' 
                    ? 'bg-white text-amber-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid="viewer-toggle-native"
              >
                Native Viewer
              </button>
            </div>
            
            {/* Open in new tab */}
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Open in Google Drive"
              data-testid="open-in-drive-btn"
            >
              <ExternalLink className="w-5 h-5 text-gray-600" />
            </a>
            
            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              data-testid="fullscreen-btn"
            >
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Close button */}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              title="Close (Esc)"
              data-testid="close-viewer-btn"
            >
              <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
            </button>
          </div>
        </div>
        
        {/* Document Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {viewerType === 'google' ? (
            <iframe
              src={googleViewUrl}
              className="w-full h-full border-0"
              title={`Document viewer: ${file.name}`}
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              data-testid="google-drive-iframe"
            />
          ) : (
            <div className="w-full h-full" data-testid="native-doc-viewer">
              <DocViewer
                documents={nativeViewerDocs}
                pluginRenderers={DocViewerRenderers}
                style={{ height: '100%' }}
                config={{
                  header: {
                    disableHeader: true,
                    disableFileName: true,
                  },
                  pdfVerticalScrollByDefault: true,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions for file icons and types
const getFileIconEmoji = (mimeType) => {
  const icons = {
    'application/pdf': '📕',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '🌅',
    'application/vnd.google-apps.document': '📄',
    'application/vnd.google-apps.spreadsheet': '📊',
    'application/vnd.google-apps.presentation': '🎭',
    'application/msword': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.ms-powerpoint': '🌅',
    'text/plain': '📃',
    'text/csv': '📋',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
  };
  return icons[mimeType] || '📄';
};

const getFileTypeLabel = (mimeType) => {
  const labels = {
    'application/pdf': 'PDF Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
    'application/vnd.google-apps.document': 'Google Doc',
    'application/vnd.google-apps.spreadsheet': 'Google Sheet',
    'application/vnd.google-apps.presentation': 'Google Slides',
    'application/msword': 'Word Document (Legacy)',
    'application/vnd.ms-excel': 'Excel Spreadsheet (Legacy)',
    'application/vnd.ms-powerpoint': 'PowerPoint (Legacy)',
    'text/plain': 'Text File',
    'text/csv': 'CSV File',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
  };
  return labels[mimeType] || 'File';
};

// Recursive folder tree component - moved outside DocumentManagement
const FolderTree = ({ 
  data, 
  level = 0, 
  expandedFolders, 
  selectedFolderId, 
  folderContents, 
  toggleExpand, 
  handleFolderClick 
}) => {
  if (!data?.folders?.length) return null;

  return (
    <div className={`space-y-1 ${level > 0 ? 'ml-4 mt-1 border-l-2 border-gray-200 pl-2' : ''}`}>
      {data.folders.map((folder) => {
        const isExpanded = expandedFolders[folder.id];
        const isSelected = selectedFolderId === folder.id;
        const hasLoadedContents = folderContents[folder.id];

        return (
          <div key={folder.id}>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(folder.id);
                }}
                className="flex items-center justify-center p-1 hover:bg-amber-100 rounded transition-all"
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
                    ? 'bg-amber-100 border-2 border-amber-500' 
                    : 'hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <Folder className={`w-5 h-5 ${isSelected ? 'text-amber-600' : 'text-yellow-500'}`} />
                <span className={`text-sm font-medium truncate ${isSelected ? 'text-amber-700' : 'text-gray-700'}`}>
                  {folder.name}
                </span>
              </button>
            </div>
            
            {isExpanded && (
              <div className="ml-4">
                {folderContents[folder.id] ? (
                  folderContents[folder.id].folders?.length > 0 ? (
                    <FolderTree 
                      data={folderContents[folder.id]} 
                      level={level + 1}
                      expandedFolders={expandedFolders}
                      selectedFolderId={selectedFolderId}
                      folderContents={folderContents}
                      toggleExpand={toggleExpand}
                      handleFolderClick={handleFolderClick}
                    />
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

const DocumentManagement = () => {
  const { isOnline, showToast, cacheDriveFolderData, getCachedDriveFolderData } = useApp();
  const navigate = useNavigate();
  const [rootFolderData, setRootFolderData] = useState({ folders: [], files: [] });
  const [folderContents, setFolderContents] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [displayedFiles, setDisplayedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewerFile, setViewerFile] = useState(null); // File to view in modal

  useEffect(() => {
    loadRootFolder();
  }, []);

  // Update displayed files when selection changes
  useEffect(() => {
    if (selectedFolderId && folderContents[selectedFolderId]) {
      setDisplayedFiles(folderContents[selectedFolderId].files || []);
    } else if (!selectedFolderId) {
      setDisplayedFiles(rootFolderData.files || []);
    }
  }, [rootFolderData, selectedFolderId, folderContents]);

  const loadRootFolder = async () => {
    setIsLoading(true);
    try {
      const result = await fetchDriveFolder(DOCUMENT_ROOT_FOLDER);
      const folderData = result.data || { folders: [], files: [] };
      setRootFolderData(folderData);
      setDisplayedFiles(folderData.files || []);
      await cacheDriveFolderData(DOCUMENT_ROOT_FOLDER, folderData);
    } catch (error) {
      const cached = await getCachedDriveFolderData(DOCUMENT_ROOT_FOLDER);
      if (cached && cached.data) {
        setRootFolderData(cached.data);
        setDisplayedFiles(cached.data.files || []);
        showToast('Loaded cached documents', 'info');
      } else {
        showToast('Failed to load documents', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      setDisplayedFiles(data.files || []);
    } catch (error) {
      showToast('Failed to load folder contents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRootClick = () => {
    setSelectedFolderId(null);
    setSelectedFolderName('');
    setDisplayedFiles(rootFolderData.files || []);
  };

  const getFileIcon = (mimeType) => {
    return getFileIconEmoji(mimeType);
  };

  const getFileType = (mimeType) => {
    const labels = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'application/vnd.google-apps.document': 'GDOC',
      'application/vnd.google-apps.spreadsheet': 'GSHEET',
      'application/vnd.google-apps.presentation': 'GSLIDE',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
    };
    return labels[mimeType] || 'FILE';
  };

  // Handle file click - open in viewer or new tab
  const handleFileClick = (file, e) => {
    e.preventDefault();
    if (isViewableFile(file) || isImageFile(file.name) || isImageMimeType(file.mimeType)) {
      setViewerFile(file);
    } else {
      // For non-viewable files, open in Google Drive
      window.open(file.webViewLink, '_blank');
    }
  };

  const filteredFiles = searchTerm
    ? displayedFiles.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : displayedFiles;

  // Separate images and non-images
  const imageFiles = filteredFiles.filter(file => 
    isImageFile(file.name) || isImageMimeType(file.mimeType)
  );
  const nonImageFiles = filteredFiles.filter(file => 
    !isImageFile(file.name) && !isImageMimeType(file.mimeType)
  );

  // Prepare PhotoSwipe items for images
  const photoSwipeItems = preparePhotoSwipeItems(imageFiles, false);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      {/* Document Viewer Modal */}
      {viewerFile && (
        <DocumentViewerModal 
          file={viewerFile} 
          onClose={() => setViewerFile(null)} 
        />
      )}
      
      <div className="flex-1 flex overflow-hidden bg-gradient-to-b from-amber-50 to-white">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Documents
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
                  ? 'bg-amber-100 border-2 border-amber-500' 
                  : 'hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <Folder className={`w-5 h-5 ${!selectedFolderId ? 'text-amber-600' : 'text-yellow-500'}`} />
              <span className={`text-sm font-semibold ${!selectedFolderId ? 'text-amber-700' : 'text-gray-700'}`}>
                All Documents
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
              <FolderTree 
                data={rootFolderData}
                expandedFolders={expandedFolders}
                selectedFolderId={selectedFolderId}
                folderContents={folderContents}
                toggleExpand={toggleExpand}
                handleFolderClick={handleFolderClick}
              />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-6 h-6 text-amber-500" />
                Document Management
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
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
                  <p className="text-gray-600">Select a folder to view documents</p>
                </div>
              </div>
            ) : (
              <PhotoSwipeGallery 
                galleryID="document-gallery"
                images={photoSwipeItems}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Render images first */}
                  {imageFiles.map((file, index) => (
                    <a
                      key={file.id}
                      href={convertToHDUrl(file.thumbnailLink || file.webViewLink)}
                      data-pswp-width="2048"
                      data-pswp-height="1536"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                      data-testid={`doc-image-${index}`}
                    >
                      <div className="aspect-video bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        {file.thumbnailLink ? (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-6xl">🖼️</div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-gray-900 break-words">{file.name}</p>
                      </div>
                    </a>
                  ))}
                  
                  {/* Render non-image files */}
                  {nonImageFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={(e) => handleFileClick(file, e)}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative"
                      data-testid={`doc-file-${file.id}`}
                    >
                      {/* View indicator */}
                      {isViewableFile(file) && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to View
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-5xl mb-3">{getFileIcon(file.mimeType)}</div>
                        <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded inline-block mb-3">
                          {getFileType(file.mimeType)}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 break-words">{file.name}</p>
                      </div>
                    </div>
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

export default DocumentManagement;
