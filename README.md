# Abbey Autos Centre — website

Static single-page site for Abbey Autos Centre Ltd, 1–2 Hillreach, Woolwich SE18 4AJ.
No build step: plain HTML, inline CSS, one inline script. Deploy the repo root as-is.

```
index.html                          the site
thanks.html                         form success page (form posts here)
_headers                            Netlify response headers (pre-launch noindex)
netlify.toml                        build config
favicon.svg
img/                                photography, WebP with JPEG fallback
scripts/sync-google-rating.mjs      writes the live Google rating into index.html
netlify/functions/refresh-rating.mjs  daily cron that triggers a rebuild
```

There is no framework and no bundler. The "build" is one script that refreshes
the Google rating; everything else is served exactly as committed.

Currently deployed for client review at **https://abbey-autos.netlify.app/**

---

## ⚠️ Before go-live

This site is **not yet client-approved** and is deliberately kept out of search —
an unapproved site for a real, trading business must not compete with their
actual listing. Three edits flip it live:

1. **`index.html`, the PRE-LAUNCH block at the top of `<head>`** —
   `<meta name="robots" content="noindex, nofollow">`
   → `<meta name="robots" content="index, follow, max-image-preview:large">`
2. **Find/replace `https://abbey-autos.netlify.app/`** with the real live URL.
   It appears in: `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`,
   and the JSON-LD block at the bottom of the file.
3. **`_headers`** — delete the `X-Robots-Tag: noindex, nofollow` line. Keep the
   two security headers below it.

Then submit the URL in Google Search Console and confirm the business's Google
Business Profile points at the same domain.

`thanks.html` stays `noindex` permanently — that's intentional.

### While it's still a demo

The Netlify URL is public to anyone who has the link. If the client wants it
genuinely private during review, Netlify's site-level password protection is
the way — it's a dashboard setting on a paid plan, not something this repo can
configure. The `noindex` headers keep it out of search, but they don't keep it
behind a login.

---

## Things still worth adding (need client confirmation first)

Nothing on this site claims anything the client hasn't already put in writing.
These would each strengthen it, but only once confirmed:

- **Accreditations** — Trust My Garage / Good Garage Scheme / IMI / ATA, if held.
  Drops straight into the `#credentials` bar under the hero.
- **Prices** — an MOT has a fixed statutory ceiling, so publishing the figure is
  normal practice and removes a real objection.
- **Warranty terms in numbers** — the site says "every job carries our warranty";
  "12 months / 12,000 miles, parts and labour" (or whatever it actually is) is
  much stronger.
- **Named technicians** — a photo and a name with years served. Currently there
  is no identifiable person anywhere on the site.
- **Courtesy car / collection and delivery**, if offered.
- **FAQ section** — doubles as objection handling and long-tail SEO.

---

## Google rating — keeping it current

The rating and review count appear in four places on the page and once in the
JSON-LD. All of them are driven by `scripts/sync-google-rating.mjs`, so they
can never drift apart from each other.

**Never edit the numbers by hand.** Run:

```bash
node scripts/sync-google-rating.mjs --check              # is the page stale?
node scripts/sync-google-rating.mjs --rating 4.5 --count 320   # set manually
node scripts/sync-google-rating.mjs                      # fetch from Google
```

The script updates the two display figures, the star-bar fill percentage, the
`aria-label` on the rating, and `ratingValue` / `reviewCount` in the JSON-LD.

### Turning on the automatic daily refresh

Nothing below is required — without it the committed numbers simply stay put,
and you update them with `--rating`/`--count` whenever the client mentions it.

1. **Google Cloud** — create a project, enable **Places API (New)**, create an
   API key. Billing must be enabled on the project. Restrict the key to the
   Places API. It is only ever used inside the Netlify build, never in the
   browser, so it does not need a referrer restriction.
2. **Netlify → Site configuration → Environment variables** — add
   `GOOGLE_MAPS_API_KEY`. Optionally `GOOGLE_PLACE_ID` (it defaults to
   `ChIJ1zhWCvGo2EcRCL41OI7_LbM`, Abbey Autos Centre Ltd).
3. **Netlify → Build & deploy → Build hooks** — add a hook called
   "Daily rating refresh" pointing at the production branch, and put its URL in
   an environment variable called `NETLIFY_BUILD_HOOK`.

That's it. `netlify/functions/refresh-rating.mjs` fires at 04:15 UTC daily,
pokes the build hook, and the rebuild pulls the current figures. One API call
per day — check current Places API pricing and free-tier allowance before
switching it on, but at ~30 calls a month this is about as small as usage gets.

### Things worth knowing

- **Failure is safe.** No key, API down, malformed response, implausible
  numbers — the script logs, leaves `index.html` alone and exits 0. The build
  never breaks and the site never shows a wrong figure.
- **Sanity guard.** It refuses to write if the review count drops by more than
  30%, which is the signature of a wrong place ID or a bad response.
- **Rounding.** Displayed to one decimal, matching how Google itself shows it.
- **The JSON-LD `aggregateRating` will not put stars in Google's results.**
  Google does not show review rich results for self-serving `LocalBusiness`
  markup, and reviews sourced from a third party (Google itself, here) are
  outside their review-snippet guidelines. It is kept because it is accurate
  and other consumers read it, but do not expect SEO gain from it. If you would
  rather not carry it at all, delete the `aggregateRating` block from the
  JSON-LD — nothing else depends on it.
- **Attribution.** Google requires Places data to be attributed. The page
  already labels the figures as Google reviews and links to the Google listing,
  which covers it.

---

## Photography

All images are the client's own photos, re-processed — nothing was shot new and
nothing was generated. Sources live in git history (`img/_src_*.jpg`, removed
from the working tree after export).

Processing applied:

- **hero** — removed an AI-enhancement sparkle watermark baked into the
  bottom-right corner; contrast/saturation lift; upscaled and sharpened for
  retina, exported at 900/1400/2000w.
- **mot** — reframed. The previous crop showed only a doorway and tyre stacks;
  the source also contained the DVSA vehicle-testing-station signage, the
  "Catalysts Tested / Diesels Tested" board and two technicians working on a
  car. That is the strongest credibility asset on the page, so the crop now
  leads with it.
- **visit** — the facade was leaning ~2.3 degrees with converging verticals.
  Corrected with a vertical-vanishing-point keystone plus rotation; verticals
  now sit within 0.1 degrees of plumb.
- **about** — verticals were 2.4 degrees off, pure camera roll, fixed with a
  rotation. Deliberately *not* perspective-corrected: the wall is shot
  obliquely on purpose, so its horizontals are meant to converge. Flattening
  it was tested at 35% and 100% strength and both looked worse than the
  rotation alone — the sign tilted harder and the chrome lettering stretched.
- Both then cropped to the largest rectangle fully inside the corrected frame,
  so no smeared edges.

**Straightening rule of thumb:** if the subject is a flat facade shot roughly
head-on (hero, MOT, visit), correct the perspective. If it is a surface shot at
an angle on purpose (about), only correct the roll — the receding lines are
what give it depth, and removing them makes it look wrong.

To re-export after replacing a source photo, the recipe is: crop → mild
contrast/colour → Lanczos resize → unsharp mask → save WebP q84 + progressive
JPEG q84 at two widths (three for the hero).

### Keep the width/height attributes accurate — the layout depends on them

The section images (`.split-img`, `.about-img`, `.visit-img`) are sized
`width:100%; height:auto`. They have **no fixed height in CSS**: the browser
derives each box's aspect ratio from the `width` and `height` attributes on the
`<img>`. So the image is never cropped at any viewport, and the reserved space
is always exactly right (no layout shift).

If you swap a photo, update those two attributes to the exported pixel
dimensions. Get them wrong and the box will be the wrong shape.

This replaced fixed pixel heights, which caused a real bug: below the 900px
breakpoint the layout is single-column, so the image container grew from 390px
to 852px wide while its height stayed pinned at 280–340px. On a phone that
happened to land near the photo's natural ratio, but on a tablet the box became
a 2:1–3:1 letterbox and `object-fit:cover` threw away **half of every image** —
including the "MOT TESTING CENTRE" sign and the word "RECEPTION", the two most
credibility-carrying details on the page. Never reintroduce a fixed height on
these.

The hero is different and *does* crop deliberately — it is a full-bleed
background, so it keeps `object-fit:cover` with a `object-position` tuned per
breakpoint.

Below 900px the media blocks cap at `max-width:560px` and centre, so a wide
tablet does not get a 740px-tall image. For `#visit` the cap is on the
`.visit-media` wrapper rather than the image, so the photo, the map and the
"Get directions" link all line up as one block.

---

## Analytics

`tel:` clicks and form submissions already push events to `dataLayer` and call
`gtag` if present — both are no-ops until a tag is installed. For a phone-first
business the `tel:` clicks *are* the conversion, so install the tag before
judging whether the page works.

Event names: `phone_call_click` (label = which CTA), `enquiry_submit`
(label = selected service).

---

## Forms

The enquiry form is wired for Netlify (`data-netlify="true"`, honeypot on
`bot-field`) and posts to `/thanks.html`. On a different host, change the
`action` and remove the two Netlify attributes.

## Accessibility

All text passes WCAG AA contrast. `--silver` (#8d939b) is **borders and
decoration only** — use `--slate` (#666c74) for any text on a light background.
