import { csvParse, autoType } from "d3-dsv";

const makeUrl = (year) => `https://www.nomisweb.co.uk/api/v01/dataset/NM_2002_1.data.csv?geography=TYPE424&date=${year}&gender=0&c_age=200&measures=20100&select=geography_code,obs_value`;
const cols = ["areacd", "value"];
// "age=0,24,22,25";

export default async function getData(year = "latest") {
  const url = makeUrl(year);
  const res = await fetch(url);
  const str = (await res.text()).replace(/.*(?=\n)/, cols.join(","));
  const rows = csvParse(str, autoType);
  const lkp = {};
  for (const row of rows) lkp[row.areacd] = row.value;
  return lkp;
}
