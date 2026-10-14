# Anijjung Eco Village — shared central area

A runnable, interactive architectural concept built with Vite, TypeScript, and Three.js **0.180.0**, including matching addons. The repository originally contained only a title. The supplied architectural reference now guides the relative arrangement: solar at the rear left, raised water tanks and the pond at the rear, gardens on the right, workshop on the left, processing at the front right, and a timber community building in the foreground. This remains an explorable 3D site, not the reference image placed on a plane.

```bash
npm ci
npm run dev
```

Requires Node.js **22.12+** (or 20.19+) and WebGL 2. The current environment uses Node 24.19.0. For production:

```bash
npm run build
npm run preview
```

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds with Node.js 24 and the committed lockfile, then publishes `dist/` with the official GitHub Pages actions. It runs automatically on pushes to `main`, and can also be run manually from the Actions tab. No deployment secrets are required.

One-time repository setup: open **Settings → Pages**, and under **Build and deployment → Source**, select **GitHub Actions**. Then open **Actions → Deploy GitHub Pages → Run workflow** (or re-run the initial workflow if it ran before Pages was enabled). The expected project URL is:

`https://bizbew.github.io/anijjung-shared-central-area/`

The site uses relative Vite asset URLs and `import.meta.env.BASE_URL` for the logo, so JavaScript, styles, and branding load from the repository subdirectory. `index.html` uses Vite's `%BASE_URL%` for the favicon. The local development commands above continue to work at the server root.

A pushed workflow alone does not confirm publication: check for a successful **Deploy site** job and then load the Pages URL. Enabling Pages requires repository settings access; the Actions `GITHUB_TOKEN` cannot create the Pages site for the first time. If the environment blocks the GitHub API, perform this one-time setting in GitHub rather than adding a personal token to the project.

If the cloud machine does not allow the default npm cache location, use `npm ci --cache /workspace/.cache/npm`.

## Explore

- Drag to orbit, scroll or pinch to zoom; touch supports orbit and pan. The camera does not auto-rotate.
- Choose Overview, Top view, or Courtyard, or reset the camera.
- Select a building, an anchored Thai label, or any of the six accessible list entries. The Thai information panel can collapse or close.
- Resource flows are off initially. Enable them and independently toggle water, electricity, food, and organic material. Arrowheads always indicate direction; small traveling markers stop with reduced-motion preferences.
- Toggle labels or reduced quality. Mobile defaults to reduced quality, limiting pixel ratio and shadows and disabling animated water.
- Save the current rendered view as a PNG. The export contains the 3D scene, without the HTML interface and labels.

## Layout and editable assumptions

Scene units are **meters**. Dimensions and route positions are illustrative, not surveyed or verified. Edit `src/config.ts` for the site bounds (**86 × 82 m**), zone locations and extents, path widths (**2.2 m** pedestrian / **3.4 m** service), building dimensions and heights, roof overhangs (**0.65 m**), roof rise, solar module dimensions, pond radii, crop-bed dimensions, and camera bounds/presets.

| Facility | Main footprint | Eave / canopy height |
| --- | --- | --- |
| Shared solar canopy | 13 × 8 m | 3.5 m, sloped |
| Pump and treatment house | 5 × 4 m | 2.6 m |
| Treated-water collection | 3.2 × 2.6 m | 2.35 m |
| Receiving and processing | 12 × 7 m | 3.2 m |
| Tool lending and maintenance | 9 × 6.5 m | 3.2 m |
| Community meeting house | 11 × 8 m, plus a 4 × 4.8 m side wing | 3.2 m |
| Produce pickup | 3.4 × 2.8 m | 2.2 m |
| Context homes | 6 × 5 m | 2.6 m |

The tank platform is illustratively 3 m tall, with 2.8 m tanks above it. The rounded pond has an 18 × 12.8 m envelope. The gardens have two blocks of six beds, separated by an access aisle. The surrounding 600 × 600 m terrain is visual context; the hub footprint remains 86 × 82 m. Edit the terrain extent, forest count, shrub height/spacing, bed block count and gap in `config.ts`. Building envelopes use these configuration values. Equipment, furniture, structural members, greenhouse framing, detailed pipe bends, and planting positions are also editable procedural dimensions in `buildings.ts` and `vegetation.ts`; these details do not automatically adapt to large changes in the building envelope. Routes and their intermediate waypoints are editable in `flows.ts`. All heights, structural thicknesses, access widths, treatment components, and service separations require professional review before real construction.

Solar serves common facilities. The pond and storage tanks feed the pump and irrigation circuit; a separate treatment branch leads to the treated-water collection shelter. Roof gutters and downpipes collect rainwater. Water treatment is depicted schematically and **does not establish potability**. Compost is placed southeast of the gardens, away from the treatment facilities and treated-water pickup. Processing, sorting waste, compost return, and pickup routes follow the site circulation concept. Lines explain relationships and carry no measured production, savings, flow rates, or safety guarantees.

## Implementation

| Module | Responsibility |
| --- | --- |
| `scene.ts` | WebGL renderer, ACES tone mapping, sRGB output, environmental light, shadows, quality, disposal |
| `config.ts` | Editable layout, assumed dimensions, Thai descriptions, camera presets |
| `materials.ts` | Locally generated surface and foliage textures, shared materials and geometry |
| `buildings.ts` | Architecture, individually framed solar panels, equipment, furnishings, gutters, pond |
| `details.ts` | Static human-scale figures, veranda details, and garden trellises |
| `vegetation.ts` | Site paths, courtyard, pergola, crop rows, drip irrigation, tropical trees, instanced leaves |
| `flows.ts` | Four independent route groups, dashed organics, directional arrows and markers |
| `camera.ts` | OrbitControls, bounded camera, selection, occlusion and overlap filtering for labels |
| `interface.ts` / `style.css` | Responsive Thai HTML controls, accessible zone list, collapsible information |
| `main.ts` | Render loop, resize, export, context-loss recovery and lifecycle cleanup |

The renderer uses capped pixel ratio, shared basic geometries and materials, instanced foliage/crops/stones, one cached directional shadow map, and skips idle redraws. Reduced quality also thins instanced foliage evenly instead of removing whole trees. There is no bloom or expensive live reflection pass. Water has small geometric ripples and environment-based reflections; it does not reflect surrounding buildings in real time. The scene needs no remote assets or asset-loading requests; initialization failures and unsupported WebGL show a Thai fallback. GPU resources are disposed on page exit and hot reload.

## Assets and licenses

All scene meshes, texture canvases, and signage are generated by this project's procedural source. `public/anijjung-logo.svg` is a vector adaptation of the circular A logo image supplied by the project owner in this conversation, with a transparent background for the header, loading screen, and favicon. It is project branding, not a third-party stock asset; no separate license was supplied. **No third-party GLB/glTF files, texture packs, or remote fonts are used.** No unavailable asset can prevent essential rendering. Browser system fonts provide Thai text. Three.js is MIT, Vite is MIT, TypeScript is Apache-2.0, and Playwright is Apache-2.0; their license files are retained in installed packages. Adding downloaded assets later should include source URLs, attribution, and licenses here.

This is a detailed procedural first version, **not photorealistic rendering**. It has simplified plant species, equipment, roof details, and treatment machinery. Authored botanical assets, photographic PBR textures, would improve realism further. The reference is a visual target; this procedural render does not reproduce its photographic detail or verify construction feasibility.

## Browser validation

With the development server running:

```bash
# Uses /usr/bin/chromium when present; otherwise install Playwright's Chromium:
npx playwright install chromium
npm run test:browser
```

Use `CHROMIUM_PATH` for another Chromium executable, and `TEST_BASE_URL` to test a production preview. The script checks the full-quality desktop overview, then uses reduced quality for repeated software-rendered interaction checks. It reads the actual layout configuration through the pinned TypeScript compiler. It runs desktop and touch-mobile checks for zone selection from labels/list/models, camera presets/reset, label and independent flow toggles, reduced quality, a still reduced-motion view, PNG dimensions, responsive overflow, touch orbit, resize, missing requests/console errors, and unsupported WebGL. It writes screenshots and the exported PNG to the ignored `artifacts/` directory. These are UI and rendering smoke checks, not engineering validation.
