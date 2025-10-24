import { csvParse, autoType } from "d3-dsv";
import { ppd } from "./make-points";

function makeLookup(rows) {
  const lkp = {};
  for (const row of rows) {
    if (!row.value) continue;
        lkp[row.areacd] = {
        areacd: row.areacd,
        total: row.value,
        counts: ppd.map(p => Math.round(row.value / p))
      };
    }
  return { lookup: lkp };
}

function pivotData(rows) {
  if (rows.columns.length === 2) return makeLookup(rows);

  const lkp = {};
  const cats = new Set();
  for (const row of rows) {
    if (!row.value) continue;
    if (!lkp[row.areacd]) lkp[row.areacd] = {areacd: row.areacd, total: 0, breaks: []};
    if (lkp[row.areacd].total !== 0) lkp[row.areacd].breaks.push(lkp[row.areacd].total);
    lkp[row.areacd][row.category] = row.value;
    lkp[row.areacd].total += row.value;
    cats.add(row.category);
  }
  for (const cd of Object.keys(lkp)) {
    lkp[cd].breaks = lkp[cd].breaks.map(brk => brk / lkp[cd].total);
    lkp[cd].counts = ppd.map(p => Math.round(lkp[cd].total / p));
  };
  return { lookup: lkp, categories: [...cats] };
}

export default async function getData(key, resolve) {
  const path = resolve(`./data/${key}.csv`);
  console.log(`Loading data from ${path}`)
  const res = await fetch(path);
  const rows = csvParse(await res.text(), autoType);
  return {key, ...pivotData(rows)};
}
