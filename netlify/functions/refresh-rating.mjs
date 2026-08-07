/**
 * Scheduled function: triggers a rebuild once a day so the Google rating and
 * review count in index.html stay current.
 *
 * The rebuild is what actually calls the Places API — see
 * scripts/sync-google-rating.mjs. This function only pokes the build hook.
 *
 * Setup (one-off, in the Netlify dashboard):
 *   1. Site configuration -> Build & deploy -> Build hooks -> "Add build hook".
 *      Name it "Daily rating refresh", target the production branch.
 *   2. Copy the hook URL into an environment variable named NETLIFY_BUILD_HOOK.
 *   3. Add GOOGLE_MAPS_API_KEY (Places API (New) enabled, restricted to this
 *      site's build — it is only ever used server-side).
 *
 * Without NETLIFY_BUILD_HOOK this is a no-op, so it is safe to deploy before
 * any of that is configured.
 */

export const config = {
  // 04:15 UTC daily — off-peak, and well clear of any manual deploys.
  schedule: '15 4 * * *',
};

export default async () => {
  const hook = process.env.NETLIFY_BUILD_HOOK;

  if (!hook) {
    console.log('refresh-rating: NETLIFY_BUILD_HOOK is not set, nothing to do.');
    return new Response('not configured', { status: 200 });
  }

  try {
    const res = await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger_title: 'Daily Google rating refresh' }),
      signal: AbortSignal.timeout(15000),
    });
    console.log(`refresh-rating: build hook responded ${res.status}`);
    return new Response(`build hook ${res.status}`, { status: 200 });
  } catch (e) {
    // Never throw: a failed poke should not page anyone, the next run picks it up.
    console.log(`refresh-rating: build hook failed — ${e.message}`);
    return new Response('build hook failed', { status: 200 });
  }
};
