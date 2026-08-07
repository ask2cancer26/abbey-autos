#!/usr/bin/env node
/**
 * Sync the Google rating and review count into index.html at build time.
 *
 * Why build time and not the browser: the numbers have to be in the HTML
 * source so they reach the JSON-LD that crawlers read, and so the page never
 * flashes a stale figure. It also means one API call per deploy rather than
 * one per visitor, and the API key never leaves the build environment.
 *
 * Usage:
 *   node scripts/sync-google-rating.mjs                            fetch from Google
 *   node scripts/sync-google-rating.mjs --rating 4.5 --count 320   set by hand
 *   node scripts/sync-google-rating.mjs --check                    report only
 *
 * Environment:
 *   GOOGLE_MAPS_API_KEY   required to fetch (Places API (New) must be enabled)
 *   GOOGLE_PLACE_ID       defaults to the constant below
 *
 * This script never fails the build. If anything goes wrong it logs, leaves
 * index.html untouched and exits 0 — a stale rating beats a site that stops
 * deploying.
 */

import { readFile, writeFile } from 'node:fs/promises';

const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJ1zhWCvGo2EcRCL41OI7_LbM';
const FILE = new URL('../index.html', import.meta.url);

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
};

class Bail extends Error {}
const bail = (msg) => { throw new Bail(msg); };

async function fetchFromGoogle() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) bail('GOOGLE_MAPS_API_KEY is not set');

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}?languageCode=en-GB`;
  let res;
  try {
    res = await fetch(url, {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'rating,userRatingCount' },
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    bail(`request failed: ${e.message}`);
  }
  if (!res.ok) bail(`Places API returned ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const data = await res.json().catch(() => null);
  if (!data) bail('Places API returned unparseable JSON');
  return { rating: data.rating, count: data.userRatingCount };
}

function validate(rating, count, current) {
  if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 1 || rating > 5)
    bail(`rating ${JSON.stringify(rating)} is out of range`);
  if (!Number.isInteger(count) || count < 1)
    bail(`review count ${JSON.stringify(count)} is not a positive integer`);
  // A real review count only grows, bar the odd deletion. A large drop means
  // we are looking at the wrong place, or at a malformed response.
  if (current.count && count < current.count * 0.7)
    bail(`review count fell from ${current.count} to ${count} — refusing to write, check the place ID`);
}

async function main() {
  const html = await readFile(FILE, 'utf8');

  const current = {
    rating: (html.match(/<span data-rating>([^<]*)<\/span>/) || [])[1],
    count: Number((html.match(/<span data-review-count>([^<]*)<\/span>/) || [])[1]) || 0,
  };
  if (!current.rating) bail('could not find the data-rating marker in index.html');
  console.log(`[google-rating] page currently shows ${current.rating} from ${current.count} reviews`);

  let rating, count;
  if (arg('rating') || arg('count')) {
    rating = Number(arg('rating') ?? current.rating);
    count = Number(arg('count') ?? current.count);
    console.log('[google-rating] using values supplied on the command line');
  } else {
    ({ rating, count } = await fetchFromGoogle());
    console.log(`[google-rating] Google reports ${rating} from ${count} reviews`);
  }

  validate(rating, count, current);

  const ratingText = rating.toFixed(1);          // matches Google's own display rounding
  const pct = +(rating / 5 * 100).toFixed(1);    // star bar fill

  if (argv.includes('--check')) {
    const fresh = ratingText === current.rating && count === current.count;
    console.log(`[google-rating] --check: page ${fresh ? 'is up to date' : `is STALE (would become ${ratingText} / ${count})`}`);
    return;
  }

  let out = html
    .replace(/(<span data-rating>)[^<]*(<\/span>)/g, `$1${ratingText}$2`)
    .replace(/(<span data-review-count>)[^<]*(<\/span>)/g, `$1${count}$2`)
    .replace(/(data-rating-label aria-label="Rated )[^"]*(")/, `$1${ratingText} out of 5$2`)
    .replace(
      /(<linearGradient id="starFill(?:Light)?"><stop offset=")[\d.]+(%" stop-color="#f0b429"\/><stop offset=")[\d.]+(%")/g,
      `$1${pct}$2${pct}$3`)
    .replace(/("ratingValue":\s*")[^"]*(")/, `$1${ratingText}$2`)
    .replace(/("reviewCount":\s*")[^"]*(")/, `$1${count}$2`);

  if (out === html) {
    console.log('[google-rating] already up to date, nothing written.');
    return;
  }

  // Never write a file that lost its structure.
  for (const marker of ['data-rating', 'data-review-count', '"ratingValue"', 'starFillLight']) {
    if (!out.includes(marker)) bail(`rewrite lost the "${marker}" marker`);
  }
  const stops = out.match(/<linearGradient id="starFill(?:Light)?">/g) || [];
  if (stops.length !== 2) bail(`expected 2 star gradients, found ${stops.length}`);

  await writeFile(FILE, out);
  console.log(`[google-rating] updated to ${ratingText} / 5 from ${count} reviews (stars ${pct}%).`);
}

try {
  await main();
} catch (e) {
  if (e instanceof Bail) console.log(`[google-rating] ${e.message} — index.html left unchanged.`);
  else console.log(`[google-rating] unexpected error: ${e.stack} — index.html left unchanged.`);
}
process.exit(0);
