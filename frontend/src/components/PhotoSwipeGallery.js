import React, { useEffect, useRef } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

const PhotoSwipeGallery = ({ galleryID, images, children }) => {
  const lightboxRef = useRef(null);

  useEffect(() => {
    if (!images || images.length === 0) return;

    // Initialize PhotoSwipe
    lightboxRef.current = new PhotoSwipeLightbox({
      gallery: `#${galleryID}`,
      children: 'a',
      pswpModule: () => import('photoswipe'),
      
      // Zoom and pan settings
      zoom: true,
      pinchToClose: true,
      closeOnVerticalDrag: true,
      
      // UI settings
      showHideAnimationType: 'fade',
      
      // Toolbar buttons
      closeTitle: 'Close (Esc)',
      zoomTitle: 'Zoom in/out',
      arrowPrevTitle: 'Previous (arrow left)',
      arrowNextTitle: 'Next (arrow right)',
      
      // Add custom buttons
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Add copy button functionality
    lightboxRef.current.on('uiRegister', () => {
      lightboxRef.current.pswp.ui.registerElement({
        name: 'copy-button',
        order: 8,
        isButton: true,
        html: '<svg class="pswp__icn" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect x="10" y="10" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
        onClick: (event, el) => {
          const currentSlide = lightboxRef.current.pswp.currSlide;
          if (currentSlide && currentSlide.data.src) {
            // Copy image URL to clipboard
            navigator.clipboard.writeText(currentSlide.data.src).then(() => {
              // Show feedback
              const feedback = document.createElement('div');
              feedback.textContent = 'Image URL copied!';
              feedback.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 99999;
                font-size: 14px;
                font-weight: 600;
              `;
              document.body.appendChild(feedback);
              setTimeout(() => {
                feedback.style.opacity = '0';
                feedback.style.transition = 'opacity 0.3s';
                setTimeout(() => feedback.remove(), 300);
              }, 2000);
            }).catch(err => {
              console.error('Failed to copy:', err);
            });
          }
        }
      });

      // Add download button
      lightboxRef.current.pswp.ui.registerElement({
        name: 'download-button',
        order: 9,
        isButton: true,
        html: '<svg class="pswp__icn" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 20L10 14h4V8h4v6h4l-6 6z" fill="currentColor"/><path d="M8 24h16v2H8z" fill="currentColor"/></svg>',
        onClick: (event, el) => {
          const currentSlide = lightboxRef.current.pswp.currSlide;
          if (currentSlide && currentSlide.data.src) {
            const link = document.createElement('a');
            link.href = currentSlide.data.src;
            link.download = currentSlide.data.title || 'image';
            link.target = '_blank';
            link.click();
          }
        }
      });
    });

    lightboxRef.current.init();

    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
        lightboxRef.current = null;
      }
    };
  }, [galleryID, images]);

  return (
    <div id={galleryID} className="pswp-gallery">
      {children}
    </div>
  );
};

export default PhotoSwipeGallery;