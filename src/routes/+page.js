import { resolve } from "$app/paths";
import { feature } from "topojson-client";

const url = resolve("./data/topo.json");

export async function load({ fetch }) {
  const res = await fetch(url);
  const json = await res.json();
  const geojson = feature(json, Object.keys(json.objects)[0]);

  return { geojson };
}