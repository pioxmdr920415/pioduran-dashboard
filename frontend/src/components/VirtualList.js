import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Virtual List Component for rendering large lists efficiently
 * Only renders items visible in the viewport
 */
const VirtualList = ({ 
  items = [], 
  itemHeight = 100, 
  containerHeight = 600,
  renderItem,
  overscan = 3 // Number of items to render outside viewport
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Calculate visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    const total = items.length * itemHeight;
    const offset = start * itemHeight;

    return {
      startIndex: start,
      endIndex: end,
      totalHeight: total,
      offsetY: offset
    };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-auto"
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualList;
