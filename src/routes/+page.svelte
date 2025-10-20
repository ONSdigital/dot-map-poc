<script>
  import { browser } from "$app/environment";
  import { resolve } from "$app/paths";
  import {
    Header,
    Section,
    Footer,
    Dropdown
  } from "@onsvisual/svelte-components";
  import { Map, MapSource, MapLayer } from "@onsvisual/svelte-maps";
  import fetchData from "$lib/fetch-data.js";
  import makeAllPoints from "$lib/make-points.js";

  let { data } = $props();
  
  const geoLookup = (() => {
    const lkp = {};
    for (const f of data.geojson.features) lkp[f.properties.areacd] = f;
    return lkp;
  })();
  const start = 1991;
  const end = 2024;
  const years = [...Array(end - start + 1).keys()].map(i => i + start).reverse();

  const mapStyle = resolve("./data/style.json");
  const mapBounds = [-7.572, 49.960, 1.681, 58.635];

  let map = $state();
  let year = $state(years[0]);
  let dataLookup = $state();
  let geoCodes = $state(new Set(Object.keys(geoLookup)));
  let mapZoom = $state(0);
  let points = $derived.by(() => dataLookup ? makeAllPoints(dataLookup, geoLookup, Array.from(geoCodes), mapZoom) : null);

  function initMap() {
    mapZoom = Math.floor(map.getZoom());

    map.on("moveend", () => {
      console.log("moveend");
      if (map.getLayer("bounds")) {
        const features = map.queryRenderedFeatures({ layers: ["bounds"] });
        const codes = new Set(features.map(f => f.properties.areacd));
        const zoom = Math.floor(map.getZoom());
        if (!(codes.size === geoCodes.size && codes.union(geoCodes).size === codes.size)) geoCodes = codes;
        if (zoom !== mapZoom) mapZoom = zoom;
      }
    });
  }

  $effect(async () => dataLookup = await fetchData(year));
</script>

<Header compact title="Empty project" />

<Section marginTop={true}>
  <p>
    <select bind:value={year}>
      {#each years as yr}
        <option value={yr}>{yr}</option>
      {/each}
    </select>
  </p>
</Section>

<Section>
  <div class="map-container">
    <Map style={mapStyle} location={{bounds: mapBounds}} bind:map on:load={initMap} controls>
      <MapSource id="bounds" type="geojson" data={data.geojson}>
        <MapLayer id="bounds" type="line" paint={{"line-color": "grey"}}/>
      </MapSource>
      <MapSource id="points" type="geojson" data={points || {type: "FeatureCollection", features: []}}>
        <MapLayer id="points" type="circle" paint={{"circle-color": "steelblue", "circle-radius": 1}}/>
      </MapSource>
    </Map>
  </div>
</Section>

<Footer compact />

<style>
  .map-container {
    display: block;
    height: 400px;
  }
</style>