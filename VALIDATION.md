# Release 1 validation

## Irregular wrinkles and detail-loss follow-up — renderer 0.3.0

The repeating crease bands were replaced by several scales of warped, jittered crease junctions and tapered folds with varied orientation, curvature, depth and width. Added Soft creases / Crumpled paper styles, Crease definition, and an undoable reference-inspired crumple recipe with raking light. Exposed Image softness under Basic tone and added Remove softening, which sets image softness and ink spreading to zero without adding sharpening. Schema 3 records the new wrinkle controls; schema 1/2 imports and saved projects migrate explicitly.

Final validation: **16 unit tests passed, all 8 browser tests passed (32.5 seconds), and the production build passed**. This run includes original rendering, 14 film profiles, seven materials, all supplied sample exports, alpha, ICC, EXIF, fallback, GPU lifecycle, save/restore, cancelled exports, zoom and mobile touch regressions.

New pixel checks: repeated wrinkle render maximum error **0**; zero wrinkle density matched zero strength exactly; flat-view pixels were unchanged by wrinkles (**0** maximum difference). Directional relighting and new seeds produced distinct results. Increasing image softness reduced mean adjacent-pixel contrast on the original detail fixture from **23.82 → 23.03 → 22.16** at softness **0 → 45 → 100**. Finish zero exactly recovered the neutral baseline. These checks establish controllable loss, not sharpening beyond the input.

Actual exports were repeatedly inspected at full resolution during development: `artifacts/crumple/dark-paper.png`, `grey-paper.png`, and `sample-crumpled.png`. The last uses the user's `Sample/DSC_5377.jpg`; settings accompany the files. The pattern is a procedural interpretation of the reference, not a captured replica. The current UI regression measured 63 ms median / 94 ms p95 including automation polling; that is one hardware-specific run, not a universal performance guarantee.

Earlier follow-ups and the original release measurements are retained below as history.

## Canvas navigation follow-up

Added a visible percentage toolbar, pointer-anchored wheel zoom, actual-size viewing, rectangle-to-zoom, drag/touch pan, pinch zoom, keyboard navigation and Fit reset. The detail loupe now follows the transformed image coordinates. Zoomed previews refine at the default export resolution; navigation does not modify the recipe or export framing.

Validation: production build passed; both new navigation browser tests and the existing import/crop/save/PNG/JPEG workflow passed (3 focused tests, 13.5 seconds). Assertions check pointer anchoring, selected-region centring, 1:1 pixel sizing, desktop and touch reset, repeated touch actions without duplicate activation, keyboard controls, unchanged settings/undo history, and 390px layout. Agent-browser reported no page errors. Inspected actual screenshots: `artifacts/canvas-actual-size.png`, `artifacts/canvas-area-selection.png`, `artifacts/canvas-area-zoomed.png` and `artifacts/canvas-zoom-mobile.png`.

The original full-release validation below predates this focused follow-up.

Executed 2026-09-22 on Windows 11, Node 24.19.0, Chrome 153, ANGLE Direct3D11 / NVIDIA GeForce GTX 970. The original specifications remain the contract; this report records performed checks and limits, not claims of physical film/paper calibration.

## Commands and results

- `npm.cmd test`: **14 tests passed**.
- `npm.cmd run test:browser`: **4 browser suites passed**, final run about 21 seconds.
- `npm.cmd run build`: TypeScript and Vite production build passed.
- Agent-browser: actual editor opened, meaningful controls/canvas present, screenshot inspected, no page errors reported.

The browser suites exercise many assertions per suite. Generated reports are in `artifacts/`; downloaded files are reopened through Sharp for actual dimensions/format. Tests use real browser file inputs and download events, not only direct calls to rendering functions.

## Observed pixel and behavior results

| Check | Observed result |
|---|---|
| Neutral sRGB chart | Maximum channel error 1/255; mean about 0.0015/255 |
| Fourteen film profiles | Fourteen distinct grain-off chart outputs; authored neutral curves/hue or sensitivity directions documented in registry |
| Full neutral B&W including chromatic-grain setting | Maximum interchannel error 0 |
| Red/blue filter response | Red patch brightened; blue patch darkened; achromatic patch unchanged |
| Group independence | Film response 0 retained grain; Finish 0 matched neutral photographic output |
| Uniform-patch grain | Mean 135.97 vs 136 baseline; standard deviation about 2.05; larger virtual formats suppress unresolved grain |
| Source highlight isolation | Grey input unchanged by halo; point-light halo and bloom differ independently |
| Paper/materials | Seven different outputs; lighting changes relight fixed fields; flat output invariant to light direction |
| Map path | Albedo/height/roughness SHA-256 validated; synthetic aligned map fields relight; missing asset reports procedural fallback |
| Zero-gap checkerboard | Exact reconstruction after avoiding per-tile antialias seams: maximum error 0 |
| Effect bounds | Maximum tested edge/shadow/scatter configuration retained zero alpha along the outermost output pixels |
| Preview/export | 1800 × 1200 export downsampled with Canvas high-quality smoothing vs 600 × 400 neutral flat preview: mean RGBA error about 1.77/255; maximum edge error can be 255 on hard checker/text/alpha boundaries |
| EXIF orientation | Normal, mirrored, 90° and 270° fixtures: expected dimensions and corner colours; corrected once |
| Embedded display-P3 fixture | Explicit sRGB path matched baseline interior within 1 code value; worst boundary differences up to 3 |
| Alpha | Source alpha preserved in image-only output; premultiplied differences within quantisation tolerance; source transparency reveals opaque paper in object view |
| Worker/main-thread | Pixel-identical tested output (maximum error 0) |
| Image replacement | Live texture/framebuffer counts stayed constant across 15 replacements; both returned to 0 after disposal |
| Storage | Explicit IndexedDB save and restore recovered controls and original photo |
| Cancellation | Cancelled in-progress export produced no download; editor remained usable |
| Errors | Corrupt/unsupported/oversized/animated input checks, invalid/new-schema JSON, unordered cuts, crop bounds, and unknown keys rejected |
| UI | Real local sample import → controls → crop → undo/redo → saved project → downloaded PNG/JPEG → JSON restore; keyboard controls; no 390px mobile overflow |
| Network | No external requests in the normal import/edit/export flow; source files are local Blob data |

The preview comparison includes hard-edge resampling differences; it does **not** establish pixel-identical exports at different resolutions. Stable geometry and logical field coordinates are shared. The first-version film curves, material roughness/relief and grain covariance are artistic approximations, not fitted laboratory measurements.

## Measured performance

Two measurements deliberately distinguish renderer time from full UI interaction:

| Operation | Final measured time |
|---|---:|
| Decode 12 MP JPEG and first 1200 × 900 render/bitmap | 121 ms |
| Canonical 1200 × 900 interactive render, 30 tone updates | Median 5.7 ms; p95 12.6 ms |
| Keyboard change to displayed UI canvas revision, 12 updates including automation polling | Median 87 ms; p95 126 ms |
| 4000 × 3000 PNG, single sheet, render + encoding | 217 ms |
| 4000 × 3000 PNG, 36-piece grid, render + encoding | 152 ms |

The UI p95 exceeds the proposed **100 ms** target. The scheduler was reduced to one coalesced 16 ms interval and stale revisions discarded; this remains a measured performance limitation rather than an assertion of universal 60 fps. Browser automation overhead is included in the end-to-end UI measurement. Large-render times use a low-entropy synthetic 12 MP fixture, not a guarantee for every detailed photo, driver or mobile device. Shader-stage sub-times primarily represent command submission; full render/encode and displayed-revision measurements are the meaningful totals.

Estimated simultaneous surface/source/map budgets in those large runs were approximately 368 MB (single) and 333 MB (grid). These estimates include source copies, texture mips, scratch/paper/piece/output surfaces and map channels; they are **not measured total process or driver memory**. Real GPU object-count instrumentation independently checks lifecycle stability.

## Visual review and deliverables

- Inspected all 7 source samples and all 9 supplied reference images via labelled contact sheets, then inspected actual exported full images and edge details.
- Corrected an outward-contour clipping defect found in exported-image inspection; material fields now extend beyond nominal paper bounds, preserving deckles and printed fibre colour.
- Refined shared internal tear paths and narrow exposed support bands to better match the local reference direction without adding a white outline to full-bleed outer edges.
- `artifacts/sample-exports/`: all seven sample artworks at 2,000-pixel long side, matching settings recipes, three export-view examples, and a browsable gallery.
- `artifacts/profile-atlases/`: 8 comparison sheets, all 14 profiles on 4 fixtures, grain on/off. The portrait is synthetic; actual photographic skin calibration remains unverified.
- `artifacts/alpha-over-*.png`: actual transparent output composited on black, white and purple for fringe inspection.
- Desktop/mobile editor screenshots and machine-readable pixel, performance, network and resource reports are retained.

## Explicit remaining gates and limitations

1. The three original/licensed **captured material sets** requested by the research quality gate were not acquired. All bundled surfaces are clearly labelled procedural. The map loader is functional and tested with an explicitly synthetic set; it does not confer measured capture fidelity.
2. Full UI p95 target was missed in the automated measurement above. No mobile-device performance claim is made; mobile layout was emulated and the mobile export ceiling is conservative.
3. Paired-film calibration, real photographic skin calibration, physical paper measurements, HDR/RAW, printing ICC soft-proofing, true folds/curl/overlap are not implemented or claimed. Multi-photo composition was added in the 0.4.0 extension below.
4. Validation ran in Chrome on this Windows/NVIDIA device. Cross-browser/GPU exactness is not asserted. WebGL2 is required; main-thread WebGL2 fallback was tested, and unsupported devices receive an explicit message. Context-loss recovery is an explicit rebuild action, not uninterrupted rendering.
5. The paper model is a shallow material approximation; the delivered results follow the references' direction, not a reconstruction of an artist's undisclosed printing process.

## Independent photos and live section framing - renderer 0.4.0

The user's multi-photo extension uses schema 4, with migration from schemas 1-3. Each strip/grid cell can use a separate validated original, crop and fit, exposure/contrast/warmth, and whole-piece rotation/position. The canonical renderer builds a photographic atlas before applying shared paper and composition. The stage bounds expand for manual rotations/offsets. Local projects include assigned original Blobs; settings JSON includes references only.

Validation on 2026-09-22: 18 unit tests and 11 browser tests passed, plus TypeScript/Vite production build. New browser checks establish exact red/green/blue placement in separate sections; exposure changes only the selected section; worker/main-thread equality; explicit errors for missing photos; per-piece crop and tilt undo; saved multi-photo restoration after reload; and a real downloaded 2,200-pixel triptych using three supplied photographs. The live framing checks cover drag, zoom, whole-frame pixel feedback, Cancel, single-step undo and a 390-pixel mobile layout. Actual exports and desktop/mobile framing screenshots were visually inspected in artifacts/sequences/.

The section-framing left panel intentionally shows photo placement and the actual section outline. Its whole-frame panel shows the live canonical finished artwork, including global film, paper, lighting, tear joins and tilt. Photo softness remains loss-only; no sharpening is added. Global appearance controls are shared; individual film profiles/materials per cell are not part of this extension.

## Variable torn edges and visible fibres - renderer 0.5.0

The 0.5.0 extension adds independent outside/inside fraying, exposed paper, fibre length, long curling strands and fibre clumping. Soft deckle, Raw cotton and Pulled fibres are one-step recipes. Explicit boundary metadata distinguishes outer perimeter from shared cuts, including narrow grid cells. Fibre placement uses seeded material distances rather than output pixels; the photograph is not blurred or sharpened. A larger fixed safety envelope keeps framing stable while adjusting these controls. Schema 5 reads/migrates schemas 1-4, with a renderer-change notice.

Validation: 20 unit checks passed. All 13 browser scenarios passed in the final regression run, and the TypeScript/Vite production build passed. The new edge suite allows a one-code-value rasterisation difference on an otherwise unchanged outer edge (mean difference 0.000032/255). The photograph interior remains byte-identical, repeated renders and worker/main-thread results are byte-identical, and the maximum 6x6 grid with full fibres and grazing shadows has zero alpha on the export frame boundary. Inner and outer fraying change only their intended regions within that rounding tolerance. Image-only, finish-zero and clean-cut checks passed. UI checks cover live feedback, preset undo/redo, settings round-trip, a real downloaded 1,600-pixel transparent PNG, and 390-pixel mobile layout.

Inspected the two supplied edge references, actual 2,400-pixel dark-sheet and real-photo exports, pixel-scale close-ups, and transparent output over black/white/purple. Replaced overlapping segment strokes that created a rope-like rim with shallow, irregular exposure bands and individual crossed fibres. Artifacts and matching settings are in artifacts/edges/; scripts/edge-gallery.mjs rebuilds the comparison page. These remain procedural interpretations, not scanned edge assets. The maximum-strength 36-piece stress case takes about 0.8 seconds for scene composition on this device; it does not establish mobile performance.
