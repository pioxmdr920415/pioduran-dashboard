/**
 * Convert Google Drive URL to HD format
 * @param {string} url - Original Google Drive URL
 * @param {boolean} maxQuality - If true, use maximum quality (for panoramas)
 * @returns {string} - HD version of the URL
 */
export const convertToHDUrl = (url, maxQuality = false) => {
  if (!url) return url;
  
  // Resolution settings - use larger for max quality (panoramas)
  const resolution = maxQuality ? 's0' : 's2048'; // s0 = original/max size
  const dimensions = maxQuality ? 'w0-h0' : 'w2048-h2048'; // w0-h0 = original dimensions
  
  // Handle Google Drive thumbnail links (lh3.googleusercontent.com)
  if (url.includes('googleusercontent.com')) {
    // Remove all size parameters and set to maximum quality
    let hdUrl = url
      .replace(/=s\d+/, `=${resolution}`)
      .replace(/=w\d+-h\d+/, `=${dimensions}`)
      .replace(/=w\d+/, maxQuality ? '=w0' : '=w2048')
      .replace(/=h\d+/, maxQuality ? '=h0' : '=h2048');
    
    // If no size parameter exists, append one
    if (!hdUrl.includes('=s') && !hdUrl.includes('=w')) {
      hdUrl += `=${resolution}`;
    }
    
    return hdUrl;
  }
  
  // Handle Google Drive direct links
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([^\/]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      // Use direct download link for maximum quality
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
  
  return url;
};

/**
 * Convert to maximum HD quality (for panoramas)
 * @param {string} url - Original URL
 * @returns {string} - Maximum quality URL
 */
export const convertToMaxHDUrl = (url) => {
  return convertToHDUrl(url, true);
};

/**
 * Check if file is an image based on extension
 * @param {string} filename - File name
 * @returns {boolean}
 */
export const isImageFile = (filename) => {
  if (!filename) return false;
  const ext = filename.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
};

/**
 * Check if file mimetype is an image
 * @param {string} mimeType - MIME type
 * @returns {boolean}
 */
export const isImageMimeType = (mimeType) => {
  if (!mimeType) return false;
  return mimeType.startsWith('image/') && 
         (mimeType.includes('jpeg') || mimeType.includes('jpg') || 
          mimeType.includes('png') || mimeType.includes('webp'));
};

/**
 * Prepare image data for PhotoSwipe
 * @param {Array} files - Array of file objects from Google Drive
 * @param {boolean} filterImages - Whether to filter only images
 * @returns {Array} - Array of PhotoSwipe items
 */
export const preparePhotoSwipeItems = (files, filterImages = true) => {
  if (!files || !Array.isArray(files)) return [];
  
  let imageFiles = files;
  
  if (filterImages) {
    imageFiles = files.filter(file => 
      isImageFile(file.name) || isImageMimeType(file.mimeType)
    );
  }
  
  return imageFiles.map(file => ({
    src: convertToHDUrl(file.thumbnailLink || file.webViewLink),
    thumbnail: file.thumbnailLink,
    width: 2048,
    height: 1536,
    alt: file.name,
    title: file.name,
    id: file.id,
    originalFile: file
  }));
};