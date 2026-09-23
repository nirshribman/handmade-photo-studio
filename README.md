# Handmade Photo Studio

A working, local browser darkroom built from the supplied Release 1 specification. React + TypeScript + Vite, with a canonical WebGL2 photographic/material renderer and Canvas2D mask/stage composition. No account, backend, analytics, generative API, or image upload.

## Run

Requires Node 24+ for the included browser-verification tool; the application itself uses Vite's supported Node releases.

```powershell
npm.cmd install
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. On Windows, `.cmd` avoids PowerShell script-execution-policy restrictions. `npm run dev` also works in other shells. `node scripts/start-local.mjs` starts the same local server in the background with no visible helper window; logs and its PID are in `artifacts/`.

```powershell
npm.cmd run build
npm.cmd run preview
```

The production output is `dist/`. Preview serves it at http://127.0.0.1:4173. The application runs locally; uploading this source repository does not deploy a website.

The repository includes the application, specification documents, tests, original test fixtures and the credited bundled photograph. Personal `Sample/` and `reference/` images, generated `artifacts/`, dependencies, build output and local configuration are excluded from Git. Galleries mentioned below are local review outputs; generate them by running the browser tests.

## Use the studio

1. Start with the bundled Luca Bravo photograph, choose a JPEG/PNG/static WebP, or drop a local image. Source files are never overwritten.
2. Select an artwork preset. **Apply layout too** controls whether the preset changes paper framing/layout/stage; crop and source are preserved.
3. Choose **Film profile** and **Paper type** separately. A film selection changes film, grain and B&W in one undo step; a paper choice changes its material/ink recommendations. Expand any group or its **Fine adjustments** for the detailed controls.
4. Use **Crop** to move/resize a crop, set proportions or zoom. Choose Sheet, Strips or Grid; use split positions to move cuts. Gaps move complete pieces and do not remove image bands.
5. Hold **B** or **Hold to compare** to see the source. **Clean layout** temporarily removes finishing. Object, Flat print and Image only are separate previews. The zoom toolbar above the canvas offers **− / +**, a percentage menu, **Fit**, and **Zoom area**: select it and drag a rectangle around any detail. Scroll over the canvas or pinch to zoom at the pointer; drag to pan. Double-click toggles enlargement and Fit. **100% · 1:1** shows one default-export pixel per CSS screen pixel; zoom reaches 800%. The **Detail loupe** inspects a small area separately. With the canvas focused, **+ / −** zoom, **0** fits, **1** selects 100%, and arrow keys pan. **Esc** cancels area selection. Navigation does not alter crop, project settings, undo history, or export framing. The sun tool temporarily sweeps the light while dragging, then restores it.
6. **Export** offers exact dimensions, aspect lock, PNG transparency, optional shadow, or JPEG flattening onto a chosen colour. Enlargement requires opting in. Flat excludes lighting/shadow; Image only preserves the crop aspect and PNG source alpha.
7. The folder menu offers settings JSON and explicit **Save on this device**. Settings contain no photo; local saves include the original Blob and installed material maps in IndexedDB. Browser storage can be cleared or reach quota. Ctrl/Cmd+S saves locally; Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z undo/redo.

Each slider drag is one undo action. Bypass preserves latent settings. Reset group restores neutral controls. Film response zero leaves independent grain/B&W active. Finish zero removes finishing within the chosen crop and intentional layout.

## Crumpled paper and detail loss

Open **Wrinkles → Use reference crumple** for irregular crumpled kōzo with raking light in Object view. Adjust **Wrinkle size**, **Wrinkle density** and **Crease definition**; **New pattern** changes the fold arrangement. **Soft creases** gives a quieter surface. These are procedural interpretations of the supplied reference: several scales of warped crease junctions, tapering curved folds and broad bends, with independent seeds and no repeating parallel bands. The shading relights the surface without blurring or displacing the source photograph.

**Basic tone → Image softness** controls photographic detail loss. **Ink & print → Ink softness** controls additional spreading of the printed image. Set both to **0**, or click **Basic tone → Remove softening**, to disable deliberate softening in one undoable action. There is no added sharpening. Other tone, grain, paper and wrinkle settings stay as they are. Judge detail at **100%** after the status says **Refined preview**; zoom above 100% enlarges the preview pixels.

Actual dark-paper, light-paper and user-photo exports are in **`artifacts/crumple/`** with matching settings and a local `index.html` gallery. The original synthetic dark source is `tests/fixtures/dark-paper.png`; the photo example uses `Sample/DSC_5377.jpg`. Settings created by renderer 0.6.0 use schema 6. Schema 1 through 5 settings and saved local projects migrate with a visible note; the revised crease generator changes the appearance of older wrinkles.

## Torn edges and visible fibres

Open **Paper edges** and choose **Soft deckle**, **Raw cotton**, or **Pulled fibres**. The recipe is one undo step and preserves photographs, crops, tone and detail settings. In Strips/Grid it enables torn joins if needed; your outside/inside fraying amounts are retained.

- **Outer edge fraying / Inner join fraying** independently control the two regions. Inner joins need Strips/Grid and a nonzero **Torn inner edges** amount in Layout. That layout control changes the cut path; the edge controls change its fibrous finish.
- **Frayed edge width** controls the fuzzy transition. **Exposed paper** reveals the support colour chosen under Paper material; reduce it for a darker printed edge.
- **Fibre density** controls short strands. **Fibre length** changes their length; **Long strands** adds occasional longer curling threads.
- **Fine adjustments -> Fibre clumping** gathers strands into uneven tufts. **Small edge detail** changes contour roughness; **Uneven outline** changes larger variations. **New pattern** gives another seeded arrangement.
- **Outer cut -> Clean** removes outside deformation and fraying while preserving independently torn inner joins. **Image only** excludes all paper edges.

Use Object or Flat print and **Zoom area** to inspect an edge, or **100%** after Refined preview. These edge controls do not blur or sharpen the photograph. A fixed safety margin accommodates long fibres without rescaling the artwork when controls change. The margin is slightly larger in renderer 0.5.0. Schemas 1-4 migrate, with a visible notice that the revised edge rendering can change earlier output.

Actual exports, settings, transparency comparisons and UI screenshots are in **artifacts/edges/**. Open **http://127.0.0.1:5173/artifacts/edges/index.html** for comparisons. Run `node scripts/edge-gallery.mjs` after the browser tests to rebuild that local gallery. These are procedural interpretations of the supplied torn-paper references; the original photos and reference files remain untouched.

## Album backgrounds and rounded corners

Open **Album background** in the left panel. Choose **Ivory album paper**, **Aged album page**, **Kraft scrapbook**, **Black album paper**, or **Linen album cloth**. Each is an original procedural surface. **Plain colour** restores a solid background. Choosing a material is one undo step and preserves the photograph, its finish, crop and arrangement.

- Adjust **Background texture**, **Paper age**, **Foxing and stains**, **Page edge aging** and **Binding crease** independently. **Background details** offers texture scale and a new seeded pattern.
- Use **Background colour** to tint the material and **Surrounding space** to expose more album paper.
- **Photo corner mounts** adds black, ivory or kraft paper pockets. Their size is adjustable; each set follows its photo piece and rotation.
- Open **Paper edges** and choose **Rounded washi** for uneven rounded corners, a restrained fibrous edge and a worn rim. Adjust **Corner rounding**, **Worn rim**, and **Fine adjustments -> Uneven corners**. **Round corners on** chooses the outside sheet corners or every separate piece.

The background is part of the arrangement and remains visible at Finish strength zero. Paper corner rounding and wear follow edge strength and Finish strength. Neither changes photographic sharpness. Use Object or Flat print to see the album; Image only omits it. Transparent PNG surroundings omit both album paper and corner mounts. Opaque PNG/JPEG includes the album when Background is set to Include background; **Flatten onto** tints it. With Background set to Transparent, an opaque export uses the selected solid flatten colour.

The local **[album comparison gallery](http://127.0.0.1:5173/artifacts/albums/index.html)** contains actual exports and reusable settings. Run `node scripts/album-gallery.mjs` after the browser tests to rebuild it. The Taras Perevarukha, Alamy and Vecteezy links supplied in the conversation informed the material direction; their photographs and stock textures are not bundled. These are procedural interpretations, not measured scans or exact reproductions.

## Different photos in one frame

Choose **Strips** or **Grid**, then **Photos in pieces -> Different photo per piece**. **Make a portrait triptych** creates three horizontal, full-bleed sections in a portrait frame, with torn joins. **Choose photos in order** assigns several files to successive sections; choose a numbered thumbnail to replace a single photo, or drop a file onto that thumbnail. **Earlier / Later** rearranges the pieces. Unassigned sections reuse the main photo.

Select a section and click **Crop / zoom**. A large preview shows the photo clipped to that section's actual shape, and the **whole-frame preview** updates with the shared finish, paper, lighting and tilt. The selected section is outlined in the whole-frame preview. Drag the photo to position it; scroll or use the zoom slider to crop closer. Horizontal and vertical position sliders provide precise placement. Arrow keys move the focused preview; + / - zoom. Choose **Fill section** or **Show whole crop**. **Apply crop** is one undo step; **Cancel** restores the previous framing.

Each piece has **rotation**, horizontal/vertical position, and optional individual **exposure, contrast and warmth**. **Gentle stagger** gives a small alternating tilt; **Align pieces** restores straight placement while preserving photos and crops. Rotation moves the paper and photograph together. The export frame expands to retain moved/rotated pieces. Global film, B&W, grain, softness and paper controls still apply to all pieces. No sharpening is added.

Export **Artwork object** or **Flat print face** to include every section. **Main photo only** exports the main photograph. Export enlargement checks account for every individual crop. Missing originals produce an explicit error; settings JSON does not embed photographs. **Save on this device** stores all assigned originals and restores the complete composition after reload. Undo retains loaded photos for reversible replacements; the combined photo budget is 48 MP on desktop and 20 MP at mobile editor widths. Use smaller originals for large grids. A fresh editor session clears the retained undo photos.

The generated examples and framing screenshots are under local **artifacts/sequences/**. These personal-photo outputs are excluded from Git. This feature extends the original Release 1 specification's single-photo scope at the user's request.

## Your samples and reference review

The supplied `Sample/` photographs and `reference/` images were inspected locally. Reference images are not bundled into `dist/`. Open **`artifacts/sample-exports/`** for 2,000-pixel sample artworks and matching `*-settings.json` files. To reproduce one, choose the matching original from `Sample/`, then use **Restore settings**. The sample settings intentionally use stronger fibre/tear/light controls than the restrained specification presets.

The `three-views-*.png` files show Object, Flat and Image-only results from one source. `artifacts/profile-atlases/` contains all fourteen films across a colour chart, synthetic portrait, daylight photograph and point-light night fixture, both with normal grain and with grain disabled. These are actual canonical renders, not CSS screenshots.

## Features and rendering contract

- Six specified artwork presets; fourteen independently authored film responses; seven paper recipes.
- Independent tone, film, B&W, grain, ink, paper, perimeter, wrinkles and lighting groups; full numeric registry in `src/model/control-data.json`.
- Smooth neutral curves and hue/chroma transforms, one colour-to-grey branch with six hue bands and lens-filter weights, print grade/toners, one density-dependent source-space grain engine, development variants, independent highlight halo and bloom.
- Paper albedo, height-derived normals, sparse internal/perimeter fibres, roughness/coating, ink coupling, shallow creases, shared light/shadow direction, and thickness separate from lift.
- Stable integer-hash fields, 1,000 units per nominal sheet short side, continuous source/paper coordinates, shared tear boundaries, independently derived fragment-tone and placement namespaces.
- Normalised sRGB decode, EXIF corrected once, premultiplied photographic intermediates, linear material reflectance/light, and sRGB output. Source alpha reveals paper; exported transparent surroundings never contain the checkerboard.
- A source-keyed photographic cache; transient pixels/GPU resources outside React state; coalesced interactive/refined previews; revision rejection; separate immutable source/recipe snapshots for export; worker termination for cancellation.
- Actual worker/OffscreenCanvas/WebGL2 probing with main-thread WebGL2 fallback. No fake CPU fallback: when WebGL2 is unavailable, the app explains the requirement. Context loss preserves source/settings and offers a rebuild.

The height model is shallow and orthographic, not a cloth/mesh simulation. Film data are **uncalibrated authored approximations**, not measured stock matches. Grain/material variation is designed to be resolution stable; exact pixels across different GPUs/browser engines are not promised. The PNG/JPEG encoders are browser encoders. No 300-DPI claim or automatic source EXIF/GPS copying is made.

## Material maps and the remaining library gate

All seven bundled materials are **original procedural materials**, accurately labelled in the UI. Captured/hybrid map ingestion is implemented and tested. Open Paper material → Original procedural material → **Install material maps…**, and select a manifest JSON and all referenced images together.

A manifest declares ID/version, author/source, permission, captured/procedural/hybrid status, per-channel status and SHA-256, sample millimetres, common native dimensions, repeat tiling, fibre direction and OpenGL +Y normals. Supported channels: albedo, height, normal, roughness, coating and fibre. See `tests/fixtures/material/manifest.json` and [material format](docs/MATERIAL_ASSETS.md). That fixture is synthetic and explicitly **not a scan**. Missing channels retain procedural fields; missing requested assets produce a visible warning and a recorded fallback in render information. No manifest URL is fetched.

**Unfinished asset quality gate:** three verified, redistributable captured sets representing fibrous matte, smooth matte and coated photographic paper have not been acquired. Procedural materials and the tested map pipeline are delivered; they do not establish measured paper fidelity. Physical capture/scan calibration, a real-photographic skin calibration set, RAW/HDR, spectral film response, ICC printer soft-proofing, true paper folds/curl remain outside this implementation/calibration tier. Reference results are similar in material direction, not reproductions of the original artist's images or undisclosed methods.

## Limits

Input: 20 MB encoded, 24 MP decoded, maximum 12,000 pixels per side, JPEG/PNG/static WebP only. Signatures and dimensions are read before decode; animated PNG/WebP and corrupt files are rejected without replacing the current photo. GPU texture limits can further constrain input.

Output: 4,096 pixels per side and 12 MP on desktop, reduced to 4 MP on mobile, additionally bounded by queried GPU limits. Exact unsupported sizes fail visibly; no silent resizing. Memory estimates include source copies, mipmapped texture, photographic/highlight targets, paper/stage/piece surfaces and material maps, but are estimates rather than total driver/browser memory measurements. Extreme aspect ratios may not fit minimum export dimensions at this ceiling. Settings JSON: 256 KB; unknown keys/newer schemas rejected. Schema 1 preserves its monochrome strength during migration; older schemas migrate to schema 6 with a visible note.

## Verification

```powershell
node scripts/fixtures.mjs
npm.cmd test
npm.cmd run test:browser
npm.cmd run build
```

Browser tests use installed Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`; set `CHROME_PATH` to another Chromium executable when needed. If the optional `Sample/` folder is present, browser tests also export those personal photographs. Without it, the tests use shipped original fixtures and the licensed photograph, including the crumple and three-view comparisons. Film atlases and renderer checks run in both cases.

See [VALIDATION.md](VALIDATION.md) and machine-readable reports in `artifacts/`. Tests cover real downloaded files, validation/migration/history, all profile IDs, B&W neutrality and sensitivity, grain mean/format, source-highlight isolation, material relighting and map fallback, zero-gap reconstruction, preview/export agreement, orientation and embedded profiles, alpha, bounds, local save/restore, cancellation, mobile overflow/keyboard operation, network privacy, and live GPU allocation stability. The performance figures are measurements on the available device, not guarantees for other hardware.

## Code map

`src/model/` contains validated recipes, registries and history. `src/imaging/` owns input and deterministic fields. `src/layout/` partitions one image and generates shared paths. `src/render/` implements canonical shaders/compositing, map ingestion and adapters. `src/export/` validates dimensions and downloads. `src/persistence/` contains opt-in IndexedDB storage. React UI is in `src/app/`, `src/components/` and `src/styles/`.

The three controlling specification documents are retained unchanged. [ASSET_LICENSES.md](ASSET_LICENSES.md) records provenance.
