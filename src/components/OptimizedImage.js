import React, { useState, useEffect, useRef } from 'react';

/**
 * Optimized Image Component with lazy loading and intersection observer
 * Prevents layout shifts and improves performance
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholderClassName = '',
  fallback = null,
  width,
  height,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder while loading */}
      {!isLoaded && !hasError && (
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse ${placeholderClassName}`}
          aria-hidden="true"
        />
      )}

      {/* Actual image - only load when in view */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          width={width}
          height={height}
          {...props}
        />
      )}

      {/* Fallback for errors */}
      {hasError && fallback}
    </div>
  );
};

export default OptimizedImage;
