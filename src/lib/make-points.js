import { quadtree } from "d3-quadtree";
import bbox from "@turf/bbox";
import inPoly from "@turf/boolean-point-in-polygon";
import { randomPoint } from "@turf/random";

export const ppd = [200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
const lookup = {};

function quadtreeToPoints(points, count) {
  return points.slice(0, count || undefined).map(d => ({type: "Point", coordinates: d}));
}

export default function makeAllPoints(data, features, codes, zoom = 0) {
  const points = [];
  const ratio = (ppd[zoom] || 1);

  for (const cd of codes) {
    const feature = features[cd];
    let pts = lookup[cd];
    if (!pts) {
      const bb = bbox(feature);
      lookup[cd] = pts = {bb, qt: quadtree().extent([[bb[0], bb[1]], [bb[2], bb[3]]]), pts: []};
    }

    const count = Math.round(data[cd] / ratio);
    const size = pts.qt.size();
    // console.log({size, count});
    const geoms = size >= count ? quadtreeToPoints(pts.pts, count) : quadtreeToPoints(addPoints(pts.qt, pts.pts, pts.bb, feature, count));
    for (const geom of geoms) points.push(geom);
  }
  console.log({points});
  return { type: "GeometryCollection", geometries: points };
}

export function addPoints(qt, pts, bb, poly, count, numCandidates = 5) {
  if (qt.size() === 0) {
    const pt = randomPoints(1, poly, bb)[0].geometry.coordinates;
    qt.add(pt);
    pts.push(pt);
  }
  for (let i = qt.size(); i < count; i ++) {
    let bestCandidate, bestCoords, bestDistance = 0;
    const candidates = randomPoints(numCandidates, poly, bb);
    for (const cd of candidates) {
      var c = cd.geometry.coordinates, // New candidate point
          d = relDistance(qt.find(...c), c); // Distance from closest point
      if (d > bestDistance) {
        bestDistance = d;
        bestCandidate = cd;
        bestCoords = c;
      }
    }
    qt.add(bestCoords);
    pts.push(bestCoords);
  }
  return pts;
}

export function makePoints(poly, count, numCandidates = 10) {
	const bb = bbox(poly);
	const points = randomPoints(1, poly, bb); // First point
	const qt = quadtree()
		.extent([[bb[0], bb[1]], [bb[2], bb[3]]])
		.add(points[0].geometry.coordinates);
	
	while (points.length < count) {
		points.push(sample(qt, poly, bb, numCandidates));
	}
	return points;
}

function randomPoints(count, poly, bbox) {
	const points = [];
	while (points.length < count) {
		const pts = randomPoint(count - points.length, {bbox}).features;
		points.push(...pts.filter(pt => inPoly(pt, poly)));
	}
	return points;
}

function sample(qt, poly, bbox, numCandidates) {
  let bestCandidate, bestCoords, bestDistance = 0;
	const candidates = randomPoints(numCandidates, poly, bbox);
  for (const cd of candidates) {
    var c = cd.geometry.coordinates, // New candidate point
        d = relDistance(qt.find(...c), c); // Distance from closest point
    if (d > bestDistance) {
      bestDistance = d;
      bestCandidate = cd;
			bestCoords = c;
    }
  }
	qt.add(bestCoords);
  return bestCandidate;
}

function relDistance(a, b) {
  var dx = a[0] - b[0],
      dy = a[1] - b[1];
  return (dx * dx) + (dy * dy);
}