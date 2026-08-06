# Abbey Autos Centre — website

Static single-page site for Abbey Autos Centre Ltd, 1–2 Hillreach, Woolwich SE18 4AJ.
No build step: plain HTML, inline CSS, one inline script. Deploy the repo root as-is.

```
index.html      the site
thanks.html     form success page (form posts here)
_headers        Netlify response headers (carries the pre-launch noindex)
favicon.svg
img/            hero + section photography, WebP with JPEG fallback
```

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
- **about / visit** — trimmed clutter at the frame edges, levelled, sharpened.

To re-export after replacing a source photo, the recipe is: crop → mild
contrast/colour → Lanczos resize → unsharp mask → save WebP q84 + progressive
JPEG q84 at two widths (three for the hero). Keep the `width`/`height`
attributes in the markup in sync with the exported files or the page will shift
while loading.

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
