import { writeFileSync, existsSync } from "fs";
import { years, variants } from "../src/lib/config.js";

const makeUrl = (year, age, sex, cat_col) => `https://www.nomisweb.co.uk/api/v01/dataset/NM_2002_1.data.csv?geography=K02000001,K03000001,TYPE424&date=${year}&gender=${sex}&c_age=${age}&measures=20100&select=geography_code${cat_col ? `,${cat_col}` : ""},obs_value`;
const makePath = (variant, year) => `./static/data/${variant.key}_${year}.csv`;
const columns = [
  {key: "areacd", label: "geography_code"},
  {key: "value", label: "obs_value"}
];

console.log(`Downloading ${years.length * variants.length} datasets...`);

for (const variant of variants) {
  const cols = variant.cat_col ? [columns[0], {key: "category", label: variant.cat_col}, columns[1]] : columns;
  
  for (const year of years) {
    const path = makePath(variant, year);

    if (!existsSync(path)) {
      const url = makeUrl(year, variant.age, variant.sex, variant.cat_col);
      const res = await fetch(url);
      let str = await res.text();
      for (const col of cols) str = str.replace(col.label.toUpperCase(), col.key);
      writeFileSync(path, str);
      console.log(`Wrote ${path}`);
    } else {
      console.log(`${path} already downloaded`);
    }
  }
}
