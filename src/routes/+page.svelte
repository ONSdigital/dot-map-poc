<script>
  import { resolve } from "$app/paths";
  import {
    PhaseBanner,
    Header,
    Section,
    Footer
  } from "@onsvisual/svelte-components";
  import { Map, MapSource, MapLayer } from "@onsvisual/svelte-maps";
  import fetchData from "$lib/fetch-data.js";
  import makeAllPoints, { ppd } from "$lib/make-points.js";

  let { data } = $props();

  const geoLookup = (() => {
    const lkp = {};
    for (const f of data.geojson.features) lkp[f.properties.areacd] = f;
    return lkp;
  })();
  const start = 1991;
  const end = 2024;
  const years = (() => {
    const yrs = [];
    let yr = end;
    while (yr >= start) {
      yrs.push(yr);
      yr -= 5;
    }
    return yrs;
  })();

  const mapStyle = resolve("./data/style.json");
  const mapBounds = [-7.572, 49.96, 1.681, 58.635];

  let map = $state();
  let year = $state(years[0]);
  let dataLookup = $state();
  let geoCodes = $state(new Set(Object.keys(geoLookup)));
  let mapZoom = $state(0);
  let points = $derived.by(() =>
    dataLookup
      ? makeAllPoints(dataLookup, geoLookup, Array.from(geoCodes), mapZoom)
      : null
  );

  function initMap() {
    mapZoom = Math.floor(map.getZoom());

    map.on("moveend", () => {
      console.log("moveend");
      if (map.getLayer("bounds")) {
        const features = map.queryRenderedFeatures({ layers: ["bounds"] });
        const codes = new Set(features.map((f) => f.properties.areacd));
        const zoom = Math.floor(map.getZoom());
        if (
          !(
            codes.size === geoCodes.size &&
            codes.union(geoCodes).size === codes.size
          )
        )
          geoCodes = codes;
        if (zoom !== mapZoom) mapZoom = zoom;
      }
    });
  }

  $effect(async () => (dataLookup = await fetchData(year)));
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Dot density map experiment" />

<Section marginTop={true}>
  <p>
    <button onclick={() => year -= 5} disabled={year === years[years.length - 1]}>&lt;</button>
    <select bind:value={year}>
      {#each years as yr}
        <option value={yr}>{yr}</option>
      {/each}
    </select>
    <button onclick={() => year += 5} disabled={year === years[0]}>&gt;</button>
  </p>
</Section>

<Section>
  <div class="map-container">
    <Map
      style={mapStyle}
      location={{ bounds: mapBounds }}
      maxzoom={17}
      bind:map
      on:load={initMap}
      controls
    >
      <MapSource id="bounds" type="geojson" data={data.geojson}>
        <MapLayer id="bounds" type="line" paint={{ "line-color": "grey" }} />
      </MapSource>
      <MapSource
        id="points"
        type="geojson"
        data={points || { type: "FeatureCollection", features: [] }}
      >
        <MapLayer
          id="points"
          type="circle"
          paint={{
            "circle-color": "steelblue",
            "circle-radius": {
              stops: [
                [8, 1],
                [12, 2],
                [16, 4],
              ],
            },
          }}
        />
      </MapSource>
    </Map>
  </div>
  <p>1 dot = {(ppd[mapZoom] || 1).toLocaleString("en-GB")} {(ppd[mapZoom] || 1) === 1 ? "person" : "people"}</p>
</Section>

<Footer compact />

<style>
  .map-container {
    display: block;
    height: 550px;
  }
</style>
