import { quadtree } from "d3-quadtree";
import bbox from "@turf/bbox";
import inPoly from "@turf/boolean-point-in-polygon";
import { randomPoint } from "@turf/random";

const ppd = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export default function makeAllPoints(data, features, codes, zoom = 0) {
  const points = [];

  for (const cd of codes) {
    const count = data[cd];
    const feature = features[cd];
    const pts = makePoints(feature, Math.round(count / ppd[zoom]));
    points.push(...pts);
  }

  return { type: "FeatureCollection", features: points };
}

export function makePoints(poly, count, numCandidates = 2) {
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
		const pt = randomPoint(1, {bbox}).features[0];
		if (inPoly(pt, poly)) points.push(pt);
	}
	return points;
}

function sample(qt, poly, bbox, numCandidates) {
  let bestCandidate, bestCoords, bestDistance = 0;
	const candidates = randomPoints(numCandidates, poly, bbox);
  for (const cd of candidates) {
    var c = cd.geometry.coordinates, // New candidate point
        d = distance(qt.find(...c), c); // Distance from closest point
    if (d > bestDistance) {
      bestDistance = d;
      bestCandidate = cd;
			bestCoords = c;
    }
  }
	qt.add(bestCoords);
  return bestCandidate;
}

function distance(a, b) {
  var dx = a[0] - b[0],
      dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}