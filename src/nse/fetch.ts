import { fetchHttp, type SourceConfig } from "../http.js";
import { cacheGet, cacheSet } from "../cache.js";

const NSE_BASE = "https://www.nseindia.com";
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const USER_AGENT =
  process.env.NSE_MCP_UA ??
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const NSE_CONFIG: SourceConfig = {
  name: "NSE India",
  userAgent: USER_AGENT,
  defaultTtlMs: DEFAULT_TTL_MS,
  defaultAccept: "application/json, text/plain, */*",
  minIntervalMs: 350,
  timeoutMs: 30_000,
  defaultNullStatuses: [],
};

export interface NseFetchOptions {
  ttlMs?: number;
  noCache?: boolean;
}

export async function fetchNSE<T>(path: string, options: NseFetchOptions = {}): Promise<T> {
  const ttl = options.ttlMs ?? DEFAULT_TTL_MS;
  const useCache = !options.noCache;
  const cacheKey = `nse:${path}`;

  if (useCache) {
    const cached = cacheGet<T>(cacheKey);
    if (cached !== undefined) return cached;
  }

  const text = await fetchHttp(`${NSE_BASE}${path}`, NSE_CONFIG, {
    cache: false,
    headers: {
      Referer: NSE_BASE,
      "X-Requested-With": "XMLHttpRequest",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (text === null) throw new Error(`NSE API: no response for ${path}`);

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error(`NSE API: non-JSON response for ${path}`);
  }

  if (useCache) cacheSet(cacheKey, data, ttl);
  return data;
}
