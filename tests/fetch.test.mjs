import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchNSE } from "../dist/nse/fetch.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("NSE API calls do not bootstrap or send session cookies", async () => {
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ data: [{ index: "NIFTY 50" }] }), {
      headers: { "content-type": "application/json" },
    });
  };

  const result = await fetchNSE("/api/allIndices", { noCache: true });

  assert.equal(result.data[0].index, "NIFTY 50");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://www.nseindia.com/api/allIndices");
  assert.equal(requests[0].init.headers.Cookie, undefined);
  assert.ok(requests[0].init.signal instanceof AbortSignal);
});

test("an NSE 401/403 is returned without a session bootstrap retry", async () => {
  let requestCount = 0;
  globalThis.fetch = async (url) => {
    requestCount += 1;
    return new Response("denied", { status: 403 });
  };

  await assert.rejects(fetchNSE("/api/allIndices", { noCache: true }), /returned 403/);
  assert.equal(requestCount, 1);
});
