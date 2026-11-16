import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getMostActive } from "../dist/tools/mostActive.js";
import { getTopGainers } from "../dist/tools/topGainers.js";
import { getTopLosers } from "../dist/tools/topLosers.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("equity index tools parse the current NSE Next API response", async () => {
  const requests = [];
  const index = "NIFTY TEST";
  const rows = [
    { symbol: index, pChange: 0, totalTradedValue: 0 },
    { symbol: "AAA", pChange: 2, totalTradedValue: 100 },
    { symbol: "BBB", pChange: -3, totalTradedValue: 300 },
    { symbol: "CCC", pChange: 1, totalTradedValue: 200 },
  ];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ data: { data: rows } }), {
      headers: { "content-type": "application/json" },
    });
  };

  assert.deepEqual(
    (await getMostActive({ index, limit: 2 })).map((row) => row.symbol),
    ["BBB", "CCC"],
  );
  assert.deepEqual(
    (await getTopGainers({ index })).map((row) => row.symbol),
    ["AAA", "CCC"],
  );
  assert.deepEqual(
    (await getTopLosers({ index })).map((row) => row.symbol),
    ["BBB"],
  );
  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /functionName=getIndicesData&symbol=NIFTY%20TEST/);
});
