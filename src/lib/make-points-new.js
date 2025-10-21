import bbox from "@turf/bbox";
import inPoly from "@turf/boolean-point-in-polygon";
import { randomPoint } from "@turf/random";

export const ppd = [200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
const lookup = {};

export default function makeAllPoints(data, features, codes, zoom = 0) {
  const points = [];
  const ratio = (ppd[zoom] || 1);

  for (const cd of codes) {
    const feature = features[cd];
    let pts = lookup[cd];
    if (!pts) {
      const bb = bbox(feature);
      lookup[cd] = pts = {bb, pts: []};
    }

    const count = Math.round(data[cd] / ratio);
    if (pts.pts.length < count) {
      const newpts = randomPoints(count - pts.pts.length, feature, pts.bb);
      for (const pt of newpts) pts.pts.push(pt);
    }
    for (const pt of pts.pts.slice(0, count)) points.push(pt);
  }
  console.log({points});
  return { type: "GeometryCollection", geometries: points };
}

function randomPoints(count, poly, bbox) {
	const points = [];
	while (points.length < count) {
		const pts = randomPoint(count - points.length, {bbox}).features
      .filter(pt => inPoly(pt, poly));
    for (const pt of pts.map(p => p.geometry)) points.push(pt);
	}
	return points;
}
