<script>
  import { colors } from "$lib/config.js";

  let { data, geoLookup, zoom, selected, hovered } = $props();

  let activeData = $derived(data.lookup[hovered] || data.lookup[selected]);
  let comparatorData = $derived(data.lookup.K02000001);

  function getPercent(areaData, cat) {
    if (!areaData) return null;
    return (areaData[cat] / areaData.total) * 100;
  }
</script>

<div class="legend-container">
  <div class="legend-text" class:legend-fixed-width={data.categories}>
    <div>
      <strong class="ons-u-fs-m"
        >{activeData
          ? geoLookup[activeData.areacd].properties.areanm
          : "United Kingdom"}</strong
      ><br />
      <span class="text-sml"
        >{(activeData || comparatorData).total.toLocaleString("en-GB")} people</span
      >
    </div>
    <div class="ons-u-fs-s">
      1 dot represents {zoom.toLocaleString("en-GB")}
      {zoom === 1 ? "person" : "people"}
    </div>
  </div>
  {#if data.categories}
    <div class="legend-bars">
      <table class="bars-container text-sml">
        {#each data.categories as cat, i}
          {@const activePerc = getPercent(activeData, cat)}
          {@const comparatorPerc = getPercent(comparatorData, cat)}
          <tbody>
            <tr>
              <td class="bar-category">{cat}</td>
              <td class="bar-cell">
                <div
                  class="bar"
                  style:background={colors[i]}
                  style:width="{activePerc || comparatorPerc}%"
                >
                  {(activePerc || comparatorPerc).toFixed(1)}%
                </div>
                <div
                  class="marker"
                  style:left="calc({comparatorPerc}% - 2px)"
                ></div>
              </td>
            </tr>
          </tbody>
        {/each}
      </table>
      <div class="footnote ons-u-fs-s ons-u-pl-s">
        <span class="marker"></span> United Kingdom average
      </div>
    </div>
  {/if}
</div>

<style>
  .legend-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 20px;
    width: 100%;
  }
  .legend-container > div {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
  }
  .legend-text {
    flex-shrink: 1;
  }
  .legend-fixed-width {
    width: 280px;
  }
  .legend-bars {
    flex-grow: 1;
  }
  .bars-container {
    flex-grow: 1;
    width: 100%;
  }
  .bar-category {
    width: 120px;
  }
  .bar-cell {
    position: relative;
  }
  .bar {
    position: absolute;
    height: 100%;
    top: 0;
    left: 0;
    color: white;
    font-weight: bold;
    /* text-align: right; */
    padding: 0 0 0 4px;
  }
  .marker {
    position: absolute;
    height: 100%;
    width: 4px;
    top: 0;
    left: 2px;
    background: black;
  }
  .footnote {
    position: relative;
  }
  .text-sml {
    font-size: 16px;
  }
</style>
