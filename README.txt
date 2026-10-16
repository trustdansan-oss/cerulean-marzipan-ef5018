NATIONAL WAY DELIVERY LOGISTICS — 2026 REBRAND

This is a rebrand of the supplied reference application, preserving its existing customer workflow, shipment data fields, language selector, dashboard actions, tracking code flow, 8-second tracking loading sequence, email composition, and route-result layout. The National Way presentation has been restyled in graphite, olive, and warm grey with new custom vector artwork for the logo, hero transport scene, and about illustration.

ADMIN ACCESS
Use the small private-access shortcut on the site. Password: GOODS.

BUILT-IN FAST ILLUSTRATED MAP
The tracking map is now an in-app illustrated route simulation rendered locally from shipment origin, current location, destination, vehicle type, and progress. It does not require a map API key, external map tiles, or geocoding to display. It is not live GPS or road navigation.

CROSS-DEVICE DATABASE
The current frontend is configured to use the Supabase project URL embedded in inline.js / index.html / fast.html and the public table public.fast_demo_store, row id=1, with the shipment collection stored in a JSONB column named shipments. Open SUPABASE-SETUP-TEST-ONLY.sql in the SQL Editor of that exact Supabase project only if the table/policies are not already configured. Do not run setup against a different project.

SECURITY WARNING
The current browser-side sync design stores all shipments in one JSONB array and uses a publishable key without per-user authentication. The included SQL policies are TEST ONLY and allow visitors to read/replace that shared array. Use fake test data only. Do not use for real customer records until the backend is redesigned with authentication, server-side authorization, and separate shipment rows with suitable Row Level Security policies.

CROSS-DEVICE TEST
1. Deploy this folder to the same public website URL on both phones.
2. Use fake shipment data on Phone A and save it.
3. Refresh Phone B and search for the same tracking number.
4. Change the status on Phone A, save, then refresh Phone B and check the status.
5. In Supabase SQL Editor, inspect public.fast_demo_store row id=1 and its shipments JSONB value. The browser console may show errors if table permissions or schema are wrong.
This archive cannot verify the live Supabase project's configuration or deploy itself; those require access to your Supabase and hosting accounts.
EMAIL
The email composer and Netlify function remain included. Actual sending requires configuring your own email provider credentials as documented in netlify/functions/send-email.mjs. Never place secrets in browser code. Live email sending has not been tested.

DEPLOYMENT
Deploy as a Netlify site, keeping netlify/functions and netlify.toml. This archive has not been fully browser-tested; test tracking, dashboard actions, responsive layouts, and email configuration before production use.


NATIONAL WAY VISUAL UPDATE
- Green and pink brand theme, redesigned rounded controls and loading treatment.
- Tracking uses the bundled public/fast-route-map.png illustration, with the original city, street, road and landmark labels preserved; shipment progress and location fields are simulated overlays.
- The bundled FAST map is local and does not need a map API key, map tiles, or a map provider.
- Shipment storage remains browser-local unless a separate National Way database is configured.


National Way deployment safety: deploy this folder as a NEW Netlify site, not as a replacement for Mustang Delivering Company. Keep its environment variables and database separate. The bundled route map is an illustration with simulated route progress; it does not require a map API key. The Nigeria greeting uses Africa/Lagos time.


National Way approved 2026 visual identity update:
- Forest/emerald green with vivid pink accents.
- Added generated National Way branded aircraft and fleet visuals.
- Preserved bundled illustrated map, road labels, landmarks and route; no map API key is needed for the bundled FAST map.
- Customer-facing map title uses FAST instead of DEMO.
- The route vehicle is simulated based on shipment progress; this is not live GPS tracking.


LATEST MAP AND BRANDING UPDATE
- The bundled FAST route illustration remains in place at public/fast-route-map.png.
- The map is kept inside its own frame. Zoom, drag/pan, reset, mouse-wheel zoom, and two-finger pinch zoom are supported by the built-in map interaction.
- The moving route, origin/destination markers, and vehicle animation remain part of the illustrated route.
- Origin and destination labels now show available city, state/region, and country fields from the shipment record.
- Important limitation: this is the bundled illustrated local-area route map, not a full-world GIS map. The road names and landmarks printed on the image are illustrative; the route line is a simulated visual route, not a real navigation route. No map API key is required.
- Generated National Way assets are now applied in the homepage hero, admin welcome banner, tracking/loading screen, registration-photo area, and outbound email banner.
- The outbound email function now embeds public/nw-email-banner.jpg inline (CID attachment), so the email banner does not require external image hosting.
- The site's main page and fast.html are kept synchronized.
- ZIP and JavaScript syntax checks were run after this update. Live Netlify deployment, real email delivery, and mobile browser interactions have not been tested from this build environment.


LATEST WORLD MAP / DASHBOARD CLEANUP (2026-10-15)
- Replaced the local-area map illustration with a branded global country map visual showing continents and a cross-border route.
- Map image now fills the map frame; map pan and pinch interactions are enabled and zoom ceiling increased.
- Removed the bottom Contact Us buttons from the public footer.
- Added public/nw-global-branding.jpg and applied it as a subtle branded dashboard welcome background.
- The route/vehicle overlay remains a simulated animation, not verified live GPS or road navigation. The global map artwork is illustrative, not a live GIS map.


MAP CORRECTION (2026-10-15)
- Customer tracking now uses interactive OpenStreetMap tiles with country borders, labels, roads and landmarks at supported zoom levels. One-finger map drag, pinch zoom and zoom controls are supported by Leaflet.
- The map geocodes origin and destination using OpenStreetMap Nominatim and draws a straight-line visual route; this is not a road-by-road routing engine and the moving vehicle is simulated from the saved shipment progress, not live GPS.
- The map preview has been removed from Admin Edit Shipment only. The customer tracking map remains.
- Network access to OpenStreetMap tiles/geocoding is required for map details.


Latest requested changes (October 2026): removed the obstructing pink floating private-access control; added a visible yellow Admin access button on the public page and language selector; customer email template now embeds an airline-style National Way Logistics logo. Tracking logic and shipment data handling were not intentionally changed.


Latest targeted polish (2026-10):
- Obsolete pink floating bar hidden without altering tracking logic.
- Tiny yellow key access control retained with neutral “Private access” label.
- Back and direct-email buttons enlarged; Back controls styled black.
- Route map first-render fit and vehicle heading normalized to avoid upside-down orientation.
- Customer email uses the inline National Way wordmark and aircraft/fleet photo banner.

CROSS-DEVICE SYNC PATCH (2026-10-15)
- National Way now loads the shared Supabase row before enabling cloud writes, avoids treating a missing table row as an ordinary empty result, logs connection errors clearly, and polls the same shared row every five seconds / when the tab regains focus so updates from another device can appear.
- This still requires the existing Supabase project to have public.fast_demo_store, row id=1, a JSONB shipments column, and policies allowing the deployed app's intended read/write access. This build does not connect to your Supabase dashboard and cannot configure or verify live database permissions by itself.
- IMPORTANT: do not use unrestricted anonymous read/write policies with real customer data. For production, put writes behind authenticated admin/server-side authorization and use Row Level Security. Do not run test-only SQL policies on a live customer database.
- Cross-device validation remains required after deployment: create a fake record on device A, search it on device B, update it on A, and confirm B refreshes within about five seconds. If the browser console reports a Supabase 401/403/404, the live database permissions/table configuration must be fixed before synchronization can work.
