import { quadtree } from "d3-quadtree";
import pointInPolygon from "point-in-polygon-hao";
import { colors } from "./config.js";

export const ppd = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
const lookup = {};

function getColor(value, breaks) {
  for (let i = 0; i < breaks.length; i ++) {
    if (value < breaks[i]) return colors[i];
  }
  return colors[breaks.length];
}

function addColors(array, count, countsByZoom, breaks) {
  if (!breaks) {
    for (let i = array.length; i < count; i ++) array.push(colors[0]);
    return;
  }

  countsByZoom = [0, ...countsByZoom];
  const firstIndex = countsByZoom.indexOf(array.length);
  const lastIndex = countsByZoom.indexOf(count);
  const counts = [];
  for (let i = firstIndex; i < lastIndex; i ++) counts.push(countsByZoom[i + 1] - countsByZoom[i]);

  for (const ct of counts) {
    const newColors = Array(ct).keys().map(i => getColor(i / ct, breaks));
    for (const color of newColors) array.push(color);
  }
}

function shuffle(array) {
  var n = array.length, t, i;
  while (n) {
    i = Math.random() * n-- | 0; // 0 ≤ i < n
    t = array[n];
    array[n] = array[i];
    array[i] = t;
  }
  return array;
}

function coordsToFeatures(points, colors, count) {
  const pts = count ? points.slice(0, count) : points;
  return pts.map((d, i) => ({
    type: "Feature",
    geometry: {type: "Point", coordinates: d},
    properties: {color: colors[i]}
  }));
}

export default function makePoints(data, features, codes, zoom = 0) {
  console.log("updating points");

  const points = [];

  for (const cd of codes) {
    if (!data.lookup[cd]) continue;
    const feature = features[cd];
    let pts = lookup[cd];
    if (!pts) {
      const bb = feature.bbox;
      lookup[cd] = pts = {qt: quadtree().extent([[bb[0], bb[1]], [bb[2], bb[3]]]), array: [], colors: [], activeKey: data.key};
    }

    // Purge colours if dataset changes
    if (pts.activeKey !== data.key) pts.colors = [];
    pts.activeKey = data.key;

    const count = data.lookup[cd].counts[zoom] || 0;
    if (pts.qt.size() < count) addPoints(pts.qt, pts.array, feature.bbox, feature, count);
    if (pts.colors.length < count) addColors(pts.colors, count, data.lookup[cd].counts, data.lookup[cd].breaks);

    const geoms = coordsToFeatures(pts.array, pts.colors, count);
    for (const geom of geoms) points.push(geom);
  }
  return { type: "FeatureCollection", features: shuffle(points) };
}

export function addPoints(qt, pts, bbox, feature, count, numCandidates = 5) {
  const poly = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;

  if (qt.size() === 0) {
    const pt = randomPointPoly(poly, bbox);
    qt.add(pt);
    pts.push(pt);
  }
  for (let i = qt.size(); i < count; i ++) {
    let bestCoords, bestDistance = 0;
    const candidates = randomPoints(numCandidates, poly, bbox);
    for (const c of candidates) { // New candidate point
      const d = relDistance(qt.find(...c), c); // Distance from closest point
      if (d > bestDistance) {
        bestDistance = d;
        bestCoords = c;
      }
    }
    qt.add(bestCoords);
    pts.push(bestCoords);
  }
}

function randomPointBbox(bbox) {
  return [
    Math.random() * (bbox[2] - bbox[0]) + bbox[0],
    Math.random() * (bbox[3] - bbox[1]) + bbox[1],
  ];
}

function isInPoly(point, poly) {
  for (let i = 0; i < poly.length; i ++) {
    const test = pointInPolygon(point, poly[i]);
    if (test) return true;
  }
  return false;
}

function randomPointPoly(poly, bbox) {
  while (true) {
    const point = randomPointBbox(bbox);
    if (isInPoly(point, poly)) return point;
  }
}

function randomPoints(count, poly, bbox) {
  return Array(count).fill().map(i => randomPointPoly(poly, bbox));
}

function relDistance(a, b) {
  var dx = a[0] - b[0],
      dy = a[1] - b[1];
  return (dx * dx) + (dy * dy);
}