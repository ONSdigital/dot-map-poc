const ppd = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

// Dots stored in keyed arrays per GSS code
// Area status {current_dataset: year, max_zoom: z, coords: quadtree, status: []}

// Feature (dot) props
// {category(color): i, min_zoom: z}

// ON INITIAL LOAD
// query features for unique GSS codes
// check zoom level
// generate initial points for each (visible) area
// classify points (category + zoom cut-off)
// convert to geojson
// map.source.setData

// ON PAN/ZOOM (END)
// query features for unique GSS codes
// check zoom level
// for each visible GSS, check if max_zoom

// ON DATA CHANGE
// for each GSS, set max_zoom to zero
// 

// MAP PAINT (POINTS)
// fill-color: ["get", "color"]
// opacity: [
//   "step", ["zoom"],
//   ["-", 1, ["get", "min_zoom"], 0
//   ["get", "min_zoom"], 1
// ]
