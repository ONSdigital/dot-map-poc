<script>
  import { resolve } from "$app/paths";
  import {
    Theme,
    PhaseBanner,
    Header,
    Section,
    Footer,
    Dropdown,
    Select,
    Button,
    Divider,
  } from "@onsvisual/svelte-components";
  import { Map, MapSource, MapLayer, MapTooltip } from "@onsvisual/svelte-maps";
  import Legend from "$lib/Legend.svelte";
  import fetchData from "$lib/fetch-data.js";
  import makePoints, { ppd } from "$lib/make-points.js";
  import { years, variants } from "$lib/config.js";

  let { data } = $props();

  const geoLookup = (() => {
    const lkp = {};
    for (const f of data.geojson.features) lkp[f.properties.areacd] = f;
    return lkp;
  })();
  const geoOptions = data.geojson.features
    .map((f) => f.properties)
    .sort((a, b) => a.areanm.localeCompare(b.areanm, "en-GB"));

  const mapStyle = resolve("./data/style-dark.json");
  const mapBounds = [-7.57, 49.76, 1.68, 58.94]; // UK bounding box

  let map = $state();
  let selected = $state();
  let selectedArea = $derived(selected ? geoLookup[selected].properties : null);
  let hovered = $state();

  let year = $state(years[years.length - 1]);
  let variant = $state(variants[1]);
  let dataLookup = $state();
  let geoCodes = $state(new Set(Object.keys(geoLookup)));
  let mapZoom = $state(0);
  let points = $derived.by(() =>
    dataLookup
      ? makePoints(dataLookup, geoLookup, Array.from(geoCodes), mapZoom)
      : null,
  );
  // let points = $state(null);

  function initMap() {
    mapZoom = Math.floor(map.getZoom());

    map.on("moveend", () => {
      console.log("moveend");
      if (map.getLayer("bounds-fill")) {
        const features = map.queryRenderedFeatures({ layers: ["bounds-fill"] });
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

  function doSelect(e) {
    selected = e.detail.id || e.detail.areacd;
    map.fitBounds(geoLookup[selected].bbox, { padding: 100 });
  }

  $effect(
    async () =>
      (dataLookup = await fetchData(`${variant.key}_${year}`, resolve)),
  );

  $inspect(dataLookup);
</script>

<Theme theme="dark">
  <PhaseBanner phase="prototype" />
  <Header compact title="UK dot density map" />

  <Section marginTop>
    This interactive map uses points to represent the population of UK local
    authorities based on <a
      href="https://www.nomisweb.co.uk/query/construct/summary.asp?mode=construct&version=0&dataset=2002"
      target="_blank">ONS mid-year population estimates</a
    > from 1994 to 2024. Select a dataset, year or area to explore the data.
  </Section>

  <Divider />

  <Section marginTop={true} width="wide">
    <div class="select-palette">
      <Dropdown
        id="select-variant"
        label="Select dataset"
        options={variants}
        bind:value={variant}
      />
      <div class="select-year-container">
        <label class="ons-label" for="select-year">Select year</label>
        <div class="select-year-controls">
          <Button
            on:click={() => (year -= 5)}
            disabled={year === years[0]}
            small>&lt;</Button
          >
          <Dropdown
            id="select-year"
            class="inline-input"
            options={years}
            bind:value={year}
          />
          <Button
            on:click={() => (year += 5)}
            disabled={year === years[years.length - 1]}
            small>&gt;</Button
          >
        </div>
      </div>
    </div>
  </Section>

  <Section width="wide">
    <div class="map-container">
      <div class="select-container">
        <Select
          id="select-area"
          options={geoOptions}
          value={selectedArea}
          on:change={doSelect}
          on:clear={() => (selected = null)}
          labelKey="areanm"
          label="Select an area"
          placeholder="Find a local authority"
          hideLabel
        />
      </div>
      <Map
        style={mapStyle}
        location={{ bounds: mapBounds }}
        options={{ cooperativeGestures: true }}
        minzoom={3}
        maxzoom={15}
        bind:map
        on:load={initMap}
        controls
      >
        <MapSource
          id="bounds"
          type="geojson"
          data={data.geojson}
          promoteId="areacd"
        >
          <MapLayer
            id="bounds-fill"
            type="fill"
            paint={{ "fill-color": "rgba(0,0,0,0)" }}
            hover
            bind:hovered
            select
            {selected}
            on:select={doSelect}
          >
            <MapTooltip
              content={geoLookup?.[hovered]?.properties?.areanm || ""}
            />
          </MapLayer>
          <MapLayer
            id="bounds-line"
            type="line"
            paint={{ "line-color": "#666", "line-width": 1 }}
            order="place_other"
          />
          <MapLayer
            id="bounds-highlight"
            type="line"
            paint={{
              "line-color": [
                "case",
                ["==", ["feature-state", "hovered"], true],
                "white",
                ["==", ["feature-state", "selected"], true],
                "rgba(255,255,255,0.6)",
                "rgba(0,0,0,0)",
              ],
              "line-width": 2,
            }}
            order="place_other"
          />
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
              "circle-color": ["get", "color"],
              "circle-radius": {
                stops: [
                  [8, 1.5],
                  [12, 3],
                  [16, 5],
                ],
              },
            }}
            order="bounds-highlight"
          />
        </MapSource>
      </Map>
    </div>
    {#if dataLookup}
      <Legend
        data={dataLookup}
        {geoLookup}
        {selected}
        {hovered}
        zoom={ppd[mapZoom] || 1}
      />
    {/if}
  </Section>

  <Divider />

  <Section>
    <p class="ons-u-fs-s">
      Note: Points are placed randomly within local authority areas. Individual
      dots do not represent the addresses or locations of actual people.
    </p>
  </Section>

  <Footer compact />
</Theme>

<style>
  .map-container {
    display: block;
    position: relative;
    height: 550px;
  }
  .select-container {
    position: absolute;
    z-index: 1;
    top: 12px;
    left: 12px;
  }
  .select-palette {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
    width: 100%;
  }
  .select-year-controls > :global(*) {
    display: inline-block;
  }
  :global(#select-year) {
    width: 100px;
  }
</style>
