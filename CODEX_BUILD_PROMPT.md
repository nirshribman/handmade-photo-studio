Build Release 1 of Handmade Photo Studio as specified in HANDMADE_PHOTO_STUDIO_SPEC.md version 1.1 and FILM_PAPER_BW_RESEARCH.md.

The specification is currently located at:
E:/AI/Image effect/HANDMADE_PHOTO_STUDIO_SPEC.md
E:/AI/Image effect/FILM_PAPER_BW_RESEARCH.md

Read both complete documents first. If working in a different workspace, locate the attached or copied documents by filename. The main specification controls schema, field names and scope; the research companion details film/material recipes, methods and quality gates. Inspect the existing repository and its instructions before changing files. If the repository is empty, initialise a React + TypeScript + Vite application. If it already has an appropriate stack, integrate with it rather than replacing it.

Product:
Create a polished browser-based image editor with controllable film feel, dedicated black-and-white processing, and realistic paper appearance. Preserve the source subject and content. Use deterministic image processing and material rendering. The core app requires no generative image API, account, payment system, or backend.

Build the actual working editor. Do not stop after a UI mock-up, a filter-only demo, or a plan.

Scope:
Implement all Release 1 controls, six artwork presets, fourteen film-inspired profiles, seven material recipes, and the single-sheet, torn-strip, and fragmented-grid layouts. Provide Object, Flat print face and Image only preview/export views. Release 2 and Release 3 features are deferred; do not show nonfunctional controls for them.

Core user flow:
Choose an image or licensed sample, apply a preset, adjust controls, crop, compare, undo/redo, inspect details, and download PNG or JPEG. Provide settings JSON export/import and explicit “Save on this device” using IndexedDB.

Visual direction:
Use a quiet, precise editor with a large central preview, a preset/layout rail, and a grouped control inspector. The artwork should dominate. Use nontechnical control labels from the document, visible numeric values, group bypass/reset, keyboard support, and practical touch controls.

Rendering:
Implement a reusable canonical renderer separate from the UI. Prefer WebGL2 with a worker/OffscreenCanvas adapter when supported and a main-thread WebGL2 fallback. Probe actual capabilities. If a reduced fallback is implemented, describe it truthfully.

Separate:
1. Source crop and photographic processing.
2. Paper material and body mask.
3. Image-placement mask and unprinted border.
4. Piece layout, lighting, shadow, and stage composition.

Use explicit source, continuous-print, piece, stage, and output coordinate spaces. Material scale is anchored to 1,000 design units per nominal paper short side. It must remain stable across preview resolution, zoom, and export resolution.

Implement independent groups for basic tone, film response, B&W, photographic grain, ink behaviour, paper surface, perimeter, wrinkles, lighting/depth, and layout. Follow the control table ranges and neutral behaviour. No control may be decorative. Use schema 2 and the defined migration from tone.monochrome to bw. Save resolved settings and pin film/material versions and hashes.

Film:
Implement real authored response differences across all fourteen profiles. Separate neutral curves, hue/chroma character, density-dependent grain and spatial highlight effects. A different label or a saturation slider is insufficient. Use the companion's initial recipes as design seeds, not claims of measured stock accuracy. Track profile sources, transform domain and calibration status. LUTs may accelerate colour response but cannot replace grain or spatial effects. Do not apply a log-domain LUT directly to an sRGB JPEG.

Selecting a film loads its film/grain/B&W recipe as one visible undo action, preserving paper/crop/layout/basic tone/seeds. These groups remain independently adjustable afterwards. Film response zero does not erase separate grain or B&W; overall Finish zero neutralises all finish groups. Do not render grain twice. Format changes grain scale, not image framing.

Implement halo amount/size/threshold and independent bloom amount/size. Derive both from source highlights before adding glow; paper whites and transparent pixels never create light. Default visible halation to zero except the specified night profile. Development character modifies documented response variants; it does not secretly change exposure or invent detail.

B&W:
Provide one conversion branch with lens-filter looks, smooth six-band colour-to-grey controls, print contrast and image toning. Preserve neutral grey under sensitivity changes. Full neutral B&W must remain achromatic through grain; intentional toner, print warmth and paper colour are separate. Retain latent settings on group bypass. Follow the specified colour-film/B&W-film branch order and never convert twice.

Use independent saved seed namespaces. Increasing a group's strength scales its amplitude; do not interpolate size, seed, light direction, or material identity as though they were intensities. Unrelated slider changes must not regenerate random fields.

Overall Finish strength scales finish contributions. At zero it restores a neutral photographic finish within the user's current crop and intentional layout. Borders, gaps, piece count, background, and explicit placement remain. View source is a separate comparison mode.

Keep photographic grain separate from paper texture. Use multiple material scales, sparse internal fibres, a coherent uneven contour, and sparse perimeter fibres. Avoid stretched noise overlays, repetitive zigzag borders, a broad blurred halo, and automatic white outlines around full-bleed black prints.

Make paper colour and ink response interact with the image. Paper is visible in highlights and borders while printed blacks retain depth. Generate shallow wrinkles through a height field with coherent ridges and valleys. Use one light direction for surface shading and cast shadows. Derive shadows from the actual paper mask.

Realistic materials:
Support coordinated albedo, height/normal, roughness/coating and fibre maps, plus procedural counterparts. Relight the same surface when the light moves. Texture scale, rotation and normal vectors must stay aligned. Keep paper thickness separate from lift above the stage. Sheen is dielectric and restrained; roughness changes reflection width. Paper texture does not automatically imply dry/missing ink. Include the small original/licensed captured-material library described in the companion. If those assets cannot be acquired, finish the functional engine with original procedural materials and report the specific unfinished material-library gate; never label procedural or inferred maps as measured scans.

For strips and grids:
Partition one source photograph in continuous coordinates before spacing the pieces. Do not repeat the entire source in each tile. Construct a shared tear path for adjoining pieces. Gaps translate pieces rather than deleting extra image bands. Keep a shared crop/source transform. Grid tone variation is seeded, bounded, and separate from placement scatter.

Colour and alpha:
Target SDR sRGB. Correct EXIF orientation once. Use explicit colour conversion and premultiplied-alpha handling. Transparent pixels in source PNGs reveal the paper. Transparent output surroundings retain clean paper/fibre alpha and optional shadows. Never export the checkerboard.

Export:
Use the same canonical recipe and logical rendering pipeline at the chosen output resolution. Snapshot the recipe at export start. Do not enlarge a preview screenshot or rely on CSS effects that are absent from the file.

Offer exact output dimensions, PNG transparency, and JPEG flattening onto a selected colour. Respect runtime limits and the specified ceilings. Never silently downscale, silently upscale, or claim 300 dpi metadata without writing and verifying it. Handle encoder fallback, failure, and cancellation honestly.

Object view includes the final lit paper arrangement. Flat view removes directional surface shading, sheen, sidewall and cast shadows while retaining paper/ink appearance and layout. Image only branches after photographic finishing, before ink/paper/layout, and follows the source crop aspect. Preserve source alpha for image-only PNG. These views must share the same photographic intermediate and be previewable.

Performance:
Keep pixels and GPU resources out of React state. Coalesce slider changes, discard stale revisions, use fast interactive and refined idle previews, cache stable fields, and render only when needed. Release bitmaps, object URLs, workers, and GPU allocations. Recover gracefully from context loss.

Privacy and assets:
Keep user image pixels local in Release 1. Do not send images to analytics or an external model. Use procedural material assets or original/properly licensed scans. Do not redistribute Taras Perevarukha's artwork as bundled samples or imply endorsement. Record sample and texture provenance in ASSET_LICENSES.md.

Implementation order:
Follow Milestones A through F in the document. Prove import/export, implement film/B&W, then material/ink/light, layouts, and complete the product and validation. Continue through all authorised work; these milestones are not requests for repeated approval. Report a specific unresolved asset/calibration gap without claiming it has been completed.

Validation:
Run meaningful tests from the specification:
- Neutral colour and orientation.
- Seed stability under unrelated control changes.
- Numbered-checkerboard partition integrity.
- Alpha over black/white/coloured backgrounds.
- Paper/shadow bounds.
- Invalid recipe and invalid image handling.
- Preset and settings restoration.
- Real browser import -> adjustment -> downloaded export.
- Refined-preview versus downsampled-export agreement.
- Resource stability after repeated image replacement.
- Local processing confirmed through network inspection.
- Responsive and keyboard interactions.
- Production build.
- The companion's twelve film/B&W/material acceptance groups, including all fourteen profiles, colour/grey ramps, halo isolation, grain mean/scale, map relighting, three export views and recipe migration.

Inspect actual exported images, not only screenshots of the editor. Measure preview latency and export time on the available device. Report actual measurements and remaining limitations without claiming unrun checks passed.

Delivery:
Provide the working application, setup/run/build/test instructions, source code, asset provenance, and representative sample exports. Keep this specification in the repository. In the final handoff, explain what works, how it was verified, the local preview location if running, and any material limitation. Do not publish or deploy the site unless deployment is part of the user's coding-task request.
