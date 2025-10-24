import { resolve } from "$app/paths";
import { feature } from "topojson-client";
import bbox from "@turf/bbox";

const url = resolve("./data/topo.json");

export async function load({ fetch }) {
  const res = await fetch(url);
  const json = await res.json();
  const geojson = feature(json, Object.keys(json.objects)[0]);
  geojson.features = geojson.features.map(f => ({...f, bbox: bbox(f)}));

  return { geojson };
}