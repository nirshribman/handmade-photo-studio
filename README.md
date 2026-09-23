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

1. Choose a local photo or use the bundled sample. Give the composition a name in the header. Source files are never overwritten.
2. Open **Starting point** for the six artwork presets. **Apply layout too** controls whether a preset changes framing/layout/stage. Adjusted presets show **Modified**.
3. **Compose**: choose Sheet, Strips or Grid, crop the main photo, set proportions, assign photos and arrange pieces. Click a piece on the canvas or its numbered thumbnail to select it. Its outline and **Editing strip/piece ... only** label identify the active section. **Crop / zoom** gives a large section preview alongside the finished whole frame. Position and individual tone have separate disclosures.
4. **Photo**: film, tone, B&W, grain and image softness apply to all photos. **Browse film on your photo** renders film choices using the current photo/crop (the selected piece in a sequence). **Neutral** removes film response, grain and monochrome conversion while preserving manual tone. The Finish strength master controls photo and paper effects.
5. **Paper**: border, material, ink, outside/inside edges, corners and wrinkles. **Browse paper previews** shows your composition and an edge/surface detail for each procedural material. **Fine adjustments** retains every detailed control. **Inspect edge detail** opens the loupe in Object view.
6. **Presentation**: album background, surrounding space, mounts, lighting and shadows. Background aging details live under **Background details**.
7. Scroll or pinch over the canvas to zoom. For sequences, click a piece to select it; use the **Hand** tool or Alt-drag to pan. A single sheet can be panned directly. **Fit** returns to the whole composition; **Zoom area** enlarges a drawn rectangle. **100%** shows one default-export pixel per CSS pixel. The loupe inspects a small region. With the canvas focused, + / - zoom, 0 fits, 1 selects 100%, and arrow keys pan. These tools never alter the export framing. On mobile, the print remains above a scrolling inspector; **Larger preview / More controls** changes the space allocated to each.
8. **Export** opens a live output thumbnail alongside format, exact dimensions, transparency, background colour and shadow settings. The preview follows the export settings; its resolution is scaled to fit. PNG supports transparency; JPEG uses a solid background. Transparent surroundings omit album paper and mounts. Flat print excludes lighting/shadow; Image only uses the main photo. Enlargement requires opting in.
9. **Save** stores the named project and all originals on this device. The header shows **Unsaved changes**, **Saving...**, or **Saved locally**, and the active photo count. The folder menu opens saved projects or downloads/restores settings JSON. Settings contain no photographs. Browser storage can be cleared or reach quota. Ctrl/Cmd+S saves; Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z undo/redo.

Each slider drag is one undo action. Bypass preserves latent settings. Reset group restores neutral controls. Film response zero leaves independent grain/B&W active. Finish zero removes finishing within the chosen crop and intentional layout.

## Crumpled paper and detail loss

Open **Paper -> Wrinkles → Use reference crumple** for irregular crumpled kōzo with raking light in Object view. Adjust **Wrinkle size**, **Wrinkle density** and **Crease definition**; **New pattern** changes the fold arrangement. **Soft creases** gives a quieter surface. These are procedural interpretations of the supplied reference: several scales of warped crease junctions, tapering curved folds and broad bends, with independent seeds and no repeating parallel bands. The shading relights the surface without blurring or displacing the source photograph.

**Photo → Basic tone → Image softness** controls photographic detail loss. **Paper → Ink & print → Ink softness** controls additional spreading of the printed image. Set both to **0**, or click **Basic tone → Remove softening**, to disable deliberate softening in one undoable action. There is no added sharpening. Other tone, grain, paper and wrinkle settings stay as they are. Judge detail at **100%** after the status says **Refined preview**; zoom above 100% enlarges the preview pixels.

Actual dark-paper, light-paper and user-photo exports are in **`artifacts/crumple/`** with matching settings and a local `index.html` gallery. The original synthetic dark source is `tests/fixtures/dark-paper.png`; the photo example uses `Sample/DSC_5377.jpg`. Settings created by renderer 0.6.0 use schema 6. Schema 1 through 5 settings and saved local projects migrate with a visible note; the revised crease generator changes the appearance of older wrinkles.

## Torn edges and visible fibres

Open **Paper -> Paper edges** and choose **Soft deckle**, **Raw cotton**, or **Pulled fibres**. The recipe is one undo step and preserves photographs, crops, tone and detail settings. In Strips/Grid it enables torn joins if needed; your outside/inside fraying amounts are retained.

- **Outer edge fraying / Inner join fraying** independently control the two regions. Inner joins need Strips/Grid and a nonzero **Torn inner edges** amount in Paper edges. That layout control changes the cut path; the edge controls change its fibrous finish.
- **Frayed edge width** controls the fuzzy transition. **Exposed paper** reveals the support colour chosen under Paper material; reduce it for a darker printed edge.
- **Fibre density** controls short strands. **Fibre length** changes their length; **Long strands** adds occasional longer curling threads.
- **Fine adjustments -> Fibre clumping** gathers strands into uneven tufts. **Small edge detail** changes contour roughness; **Uneven outline** changes larger variations. **New pattern** gives another seeded arrangement.
- **Outer cut -> Clean** removes outside deformation and fraying while preserving independently torn inner joins. **Image only** excludes all paper edges.

Use Object or Flat print and **Zoom area** to inspect an edge, or **100%** after Refined preview. These edge controls do not blur or sharpen the photograph. A fixed safety margin accommodates long fibres without rescaling the artwork when controls change. The margin is slightly larger in renderer 0.5.0. Schemas 1-4 migrate, with a visible notice that the revised edge rendering can change earlier output.

Actual exports, settings, transparency comparisons and UI screenshots are in **artifacts/edges/**. Open **http://127.0.0.1:5173/artifacts/edges/index.html** for comparisons. Run `node scripts/edge-gallery.mjs` after the browser tests to rebuild that local gallery. These are procedural interpretations of the supplied torn-paper references; the original photos and reference files remain untouched.

## Album backgrounds and rounded corners

Open **Presentation -> Album background**. Choose **Ivory album paper**, **Aged album page**, **Kraft scrapbook**, **Black album paper**, or **Linen album cloth**. Each is an original procedural surface. **Plain colour** restores a solid background. Choosing a material is one undo step and preserves the photograph, its finish, crop and arrangement.

- Adjust **Background texture**, **Paper age**, **Foxing and stains**, **Page edge aging** and **Binding crease** independently. **Background details** contains foxing, page-edge aging, binding, texture scale and a new seeded pattern.
- Use **Background colour** to tint the material and **Surrounding space** to expose more album paper.
- **Photo corner mounts** adds black, ivory or kraft paper pockets. Their size is adjustable; each set follows its photo piece and rotation.
- Open **Paper edges** and choose **Rounded washi** for uneven rounded corners, a restrained fibrous edge and a worn rim. Adjust **Corner rounding**, then **Fine adjustments -> Worn rim / Uneven corners**. **Round corners on** chooses the outside sheet corners or every separate piece.

The background is part of the arrangement and remains visible at Finish strength zero. Paper corner rounding and wear follow edge strength and Finish strength. Neither changes photographic sharpness. Use Object or Flat print to see the album; Image only omits it. Transparent PNG surroundings omit both album paper and corner mounts. Opaque PNG/JPEG includes the album when Background is set to Include background; **Flatten onto** tints it. With Background set to Transparent, an opaque export uses the selected solid flatten colour.

The local **[album comparison gallery](http://127.0.0.1:5173/artifacts/albums/index.html)** contains actual exports and reusable settings. Run `node scripts/album-gallery.mjs` after the browser tests to rebuild it. The Taras Perevarukha, Alamy and Vecteezy links supplied in the conversation informed the material direction; their photographs and stock textures are not bundled. These are procedural interpretations, not measured scans or exact reproductions.

## Different photos in one frame

In **Compose**, choose **Strips** or **Grid**, then **Photos in pieces -> Different photo per piece**. **Make a portrait triptych** creates three horizontal, full-bleed sections in a portrait frame, with torn joins. **Choose photos in order** assigns several files to successive sections; choose a numbered thumbnail to replace a single photo, or drop a file onto that thumbnail. **Earlier / Later** rearranges the pieces. Unassigned sections reuse the main photo.

Select a section and click **Crop / zoom**. A large preview shows the photo clipped to that section's actual shape, and the **whole-frame preview** updates with the shared finish, paper, lighting and tilt. The selected section is outlined in the whole-frame preview. Drag the photo to position it; scroll or use the zoom slider to crop closer. Horizontal and vertical position sliders provide precise placement. Arrow keys move the focused preview; + / - zoom. Choose **Fill section** or **Show whole crop**. **Apply crop** is one undo step; **Cancel** restores the previous framing.

Each piece has **rotation**, horizontal/vertical position, and optional individual **exposure, contrast and warmth**. **Gentle stagger** gives a small alternating tilt; **Align pieces** restores straight placement while preserving photos and crops. Rotation moves the paper and photograph together. The export frame expands to retain moved/rotated pieces. Global film, B&W, grain, softness and paper controls still apply to all pieces. No sharpening is added.

Export **Artwork object** or **Flat print face** to include every section. **Main photo only** exports the main photograph. Export enlargement checks account for every individual crop. Missing originals produce an explicit error; settings JSON does not embed photographs. **Save project locally** stores all assigned originals and restores the complete composition after reload. Undo retains loaded photos for reversible replacements. There is no fixed combined megapixel cap and no lower cap triggered by a narrow window. Actual graphics and browser memory determine how many originals can remain loaded. A fresh editor session clears the retained undo photos.

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

Input: up to 512 MB per encoded file, with no fixed megapixel ceiling. JPEG/PNG/static WebP only. The queried GPU texture dimension is checked before decoding imported or restored originals; valid originals keep their full dimensions. Signatures, dimensions, animation and corrupt-file checks remain. Decode and GPU allocation failures leave the current composition in place.

Output: dimensions are bounded by the actual queried texture, renderbuffer and viewport limits, with no fixed 4,096-pixel or desktop/mobile megapixel ceiling. The export dialog shows the graphics dimension limit and offers **Use source resolution** for the current crop and view. The 2,400-pixel default remains a convenient starting size. Large photographic, paper and album results are transferred to the output canvas in bounded pixel blocks, avoiding the smaller WebGL drawing-buffer allocation limit without resampling. This is a block copy of full-resolution render targets, not a streaming encoder: large outputs still need enough RAM/VRAM for their full surfaces. A dimension supported by the hardware can still exceed available memory; allocation failures are reported without silent resizing. Memory estimates include source copies, mipmapped texture, photographic/highlight targets, paper/stage/piece surfaces and material maps, but are estimates rather than total driver/browser memory measurements. Extreme aspect ratios may not fit minimum export dimensions at this ceiling. Settings JSON: 256 KB; unknown keys/newer schemas rejected. Schema 1 preserves its monochrome strength during migration; older schemas migrate to schema 6 with a visible note.

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

## Interface refinement (0.7.0)

The artist/UI review is implemented without changing the renderer or schema: clearer type and contrast, four editing stages, persistent mobile preview, direct canvas selection, scoped controls, compact presets, real film/paper preview cards, named save state and an output-settings preview. See [design refinement notes](docs/DESIGN_REFINEMENT.md) for the decisions and verification.

## Larger originals (0.7.1)

The 24 MP per-photo limit, 48/20 MP combined-photo budgets and 12/4 MP export ceilings have been removed. The encoded-file allowance is 512 MB. Import, export and saved-project restoration support larger originals using the same GPU-dimension checks, independent of window width. Source-resolution export retains the existing enlargement check and never adds photographic detail. Material-map files retain their separate 4,096-pixel swatch contract.
