// Geospatial Analysis Utilities
// Provides functions for spatial analysis operations using Leaflet geometries

import L from 'leaflet';

/**
 * Calculate distance between two points using Haversine formula
 * @param {L.LatLng} point1 - First point
 * @param {L.LatLng} point2 - Second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (point1, point2) => {
  return point1.distanceTo(point2);
};

/**
 * Calculate the area of a polygon
 * @param {L.LatLng[]} latlngs - Array of LatLng points
 * @returns {number} Area in square meters
 */
export const calculateArea = (latlngs) => {
  if (!latlngs || latlngs.length < 3) return 0;

  // Calculate area using the shoelace formula
  let area = 0;
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    area += latlngs[i].lng * latlngs[j].lat;
    area -= latlngs[j].lng * latlngs[i].lat;
  }
  area = Math.abs(area) / 2;

  // Convert to square meters (approximate)
  // This is a rough approximation - for more accurate results,
  // consider using a proper geodesic area calculation library
  const EARTH_RADIUS = 6371000; // meters
  const latRad = latlngs[0].lat * Math.PI / 180;
  const meterPerDegree = Math.PI * EARTH_RADIUS / 180;
  const meterPerLngDegree = meterPerDegree * Math.cos(latRad);

  return area * meterPerLngDegree * meterPerDegree;
};

/**
 * Calculate the perimeter/length of a polyline or polygon
 * @param {L.LatLng[]} latlngs - Array of LatLng points
 * @param {boolean} closed - Whether this is a closed shape (polygon)
 * @returns {number} Perimeter/length in meters
 */
export const calculatePerimeter = (latlngs, closed = false) => {
  if (!latlngs || latlngs.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < latlngs.length - 1; i++) {
    totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
  }

  // Add closing segment for polygons
  if (closed && latlngs.length > 2) {
    totalDistance += latlngs[latlngs.length - 1].distanceTo(latlngs[0]);
  }

  return totalDistance;
};

/**
 * Create a buffer around a point
 * @param {L.LatLng} center - Center point
 * @param {number} radius - Buffer radius in meters
 * @param {number} segments - Number of segments for the circle (default: 64)
 * @returns {L.LatLng[]} Array of points forming the buffer circle
 */
export const createPointBuffer = (center, radius, segments = 64) => {
  const points = [];
  const earthRadius = 6371000; // Earth's radius in meters

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const lat = center.lat + (radius / earthRadius) * (180 / Math.PI) * Math.sin(angle);
    const lng = center.lng + (radius / earthRadius) * (180 / Math.PI) * Math.cos(angle) / Math.cos(center.lat * Math.PI / 180);
    points.push(L.latLng(lat, lng));
  }

  return points;
};

/**
 * Create a buffer around a polyline
 * @param {L.LatLng[]} latlngs - Polyline coordinates
 * @param {number} bufferDistance - Buffer distance in meters
 * @returns {L.LatLng[]} Array of points forming the buffer polygon
 */
export const createLineBuffer = (latlngs, bufferDistance) => {
  if (!latlngs || latlngs.length < 2) return [];

  const leftBuffer = [];
  const rightBuffer = [];

  for (let i = 0; i < latlngs.length - 1; i++) {
    const p1 = latlngs[i];
    const p2 = latlngs[i + 1];

    // Calculate perpendicular vector
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) continue;

    // Normalize and rotate 90 degrees for perpendicular
    const nx = -dy / length;
    const ny = dx / length;

    // Scale by buffer distance
    const earthRadius = 6371000;
    const scale = bufferDistance / earthRadius * (180 / Math.PI);

    // Create buffer points
    leftBuffer.push(L.latLng(p1.lat + ny * scale, p1.lng + nx * scale));
    rightBuffer.unshift(L.latLng(p1.lat - ny * scale, p1.lng - nx * scale));
  }

  // Add end caps
  const start = latlngs[0];
  const end = latlngs[latlngs.length - 1];

  // Simple end caps (could be improved with proper circular caps)
  const startLeft = createPointBuffer(start, bufferDistance, 8)[0];
  const startRight = createPointBuffer(start, bufferDistance, 8)[4];
  const endLeft = createPointBuffer(end, bufferDistance, 8)[0];
  const endRight = createPointBuffer(end, bufferDistance, 8)[4];

  return [...leftBuffer, endLeft, endRight, ...rightBuffer, startRight, startLeft];
};

/**
 * Check if a point is inside a polygon
 * @param {L.LatLng} point - Point to test
 * @param {L.LatLng[]} polygon - Polygon coordinates
 * @returns {boolean} True if point is inside polygon
 */
export const pointInPolygon = (point, polygon) => {
  if (!polygon || polygon.length < 3) return false;

  // Ray casting algorithm for point in polygon
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;

    if (((yi > point.lat) !== (yj > point.lat)) &&
        (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Check if two bounding boxes intersect
 * @param {L.LatLngBounds} bounds1 - First bounding box
 * @param {L.LatLngBounds} bounds2 - Second bounding box
 * @returns {boolean} True if bounds intersect
 */
export const boundsIntersect = (bounds1, bounds2) => {
  return bounds1.intersects(bounds2);
};

/**
 * Calculate intersection points between two polylines
 * @param {L.LatLng[]} line1 - First polyline
 * @param {L.LatLng[]} line2 - Second polyline
 * @returns {L.LatLng[]} Array of intersection points
 */
export const lineIntersection = (line1, line2) => {
  const intersections = [];

  for (let i = 0; i < line1.length - 1; i++) {
    for (let j = 0; j < line2.length - 1; j++) {
      const intersection = getLineIntersection(
        line1[i], line1[i + 1],
        line2[j], line2[j + 1]
      );
      if (intersection) {
        intersections.push(intersection);
      }
    }
  }

  return intersections;
};

/**
 * Calculate intersection point between two line segments
 * @param {L.LatLng} p1 - Start of first line
 * @param {L.LatLng} p2 - End of first line
 * @param {L.LatLng} p3 - Start of second line
 * @param {L.LatLng} p4 - End of second line
 * @returns {L.LatLng|null} Intersection point or null if no intersection
 */
const getLineIntersection = (p1, p2, p3, p4) => {
  const denom = (p1.lng - p2.lng) * (p3.lat - p4.lat) - (p1.lat - p2.lat) * (p3.lng - p4.lng);
  if (Math.abs(denom) < 1e-10) return null; // Lines are parallel

  const t = ((p1.lng - p3.lng) * (p3.lat - p4.lat) - (p1.lat - p3.lat) * (p3.lng - p4.lng)) / denom;
  const u = -((p1.lng - p2.lng) * (p1.lat - p3.lat) - (p1.lat - p2.lat) * (p1.lng - p3.lng)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return L.latLng(
      p1.lat + t * (p2.lat - p1.lat),
      p1.lng + t * (p2.lng - p1.lng)
    );
  }

  return null;
};

/**
 * Calculate the centroid of a polygon
 * @param {L.LatLng[]} latlngs - Polygon coordinates
 * @returns {L.LatLng} Centroid point
 */
export const calculateCentroid = (latlngs) => {
  if (!latlngs || latlngs.length === 0) return null;

  let latSum = 0;
  let lngSum = 0;

  latlngs.forEach(point => {
    latSum += point.lat;
    lngSum += point.lng;
  });

  return L.latLng(latSum / latlngs.length, lngSum / latlngs.length);
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export const toRadians = (degrees) => {
  return degrees * Math.PI / 180;
};

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export const toDegrees = (radians) => {
  return radians * 180 / Math.PI;
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

/**
 * Format area for display
 * @param {number} squareMeters - Area in square meters
 * @returns {string} Formatted area string
 */
export const formatArea = (squareMeters) => {
  if (squareMeters >= 1000000) {
    return `${(squareMeters / 1000000).toFixed(2)} km²`;
  } else if (squareMeters >= 10000) {
    return `${(squareMeters / 10000).toFixed(2)} ha`;
  }
  return `${Math.round(squareMeters)} m²`;
};

export default {
  calculateDistance,
  calculateArea,
  calculatePerimeter,
  createPointBuffer,
  createLineBuffer,
  pointInPolygon,
  boundsIntersect,
  lineIntersection,
  calculateCentroid,
  toRadians,
  toDegrees,
  formatDistance,
  formatArea,
};