# Motick

The Motick product concept at **https://motick.civ.fm/**.

## Edit and build

Requires Node.js 22+ and Python 3 for the local preview server.

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:4173/. Edit `src/index.html`, `src/style.css`, `src/app.js`, and `src/scene.js`; rebuild and refresh after changes.

`index.html` and the versioned bundles in `assets/` are committed deployment artifacts. GitHub Pages publishes the root of `main`. Keep `CNAME` and `.nojekyll`. No DNS changes are needed for routine releases.

## Product visualization

The Three.js model is generated locally from geometry and a procedural wood texture. All assets are served from this site; there are no analytics, third-party runtime requests, remote fonts, or external model downloads. Rendering pauses offscreen and when the model is idle. The explorer loads near the viewport; the hero uses the same bundled renderer.

The model is an illustrative design study, not manufacturing CAD. The model has exactly three end-to-end 30 cm sections (90 cm total) with a shared outer diameter: walnut, brushed aluminum, and dark composite. Only those three groups separate in the exploded view. Joining details are conceptual, and no engineering, performance, certifications, availability, or final price are claimed. The exploration CTA navigates to the viewer. No checkout, reservations, or signup form is implemented.

Controls include a native keyboard-accessible range input, assemble/explode, left/right rotation, reset, component descriptions, opt-in scroll following on mobile, and an illustrated alternative. The system's reduced-motion preference disables automatic motion; users can also choose reduced motion. If WebGL or the renderer fails, SVG illustrations and component descriptions remain available.

## Release checks

- Desktop and narrow mobile layouts; no horizontal document overflow.
- Scroll following, manual override, keyboard Home/End on the slider, rotation, and reset.
- Component descriptions and labels, plus the illustrated alternative.
- Simulated unavailable WebGL and system reduced-motion preference in local-only `.qa/` fixtures (never committed).
- HTTPS response, deployed HTML and asset hashes, and a live browser check after publishing.

Three.js is MIT licensed; the license is included in `assets/three-LICENSE.txt`.
