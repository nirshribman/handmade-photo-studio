# Handmade Photo Studio — product analysis and implementation specification

Version: 1.1  
Prepared: 2026-09-22  
Status: Proposed product and engineering specification; no application has been implemented or benchmarked by this document.  
Deliverable: A browser-based service that transforms a supplied photograph through controllable film response, dedicated black-and-white conversion, and realistic paper rendering.

Expanded research: [Film, paper, and B&W](./FILM_PAPER_BW_RESEARCH.md). Read this companion for fourteen researched film directions, their proposed digital recipes, seven material families, capture/calibration methods, and additional acceptance tests. The field names and release contract below are authoritative. All new numerical defaults are proposed design values, not measured film or paper properties.

Quick navigation: [Reference analysis](#2-what-the-references-establish) · [Release scope](#3-scope-and-release-boundaries) · [Controls](#5-complete-control-specification) · [Presets](#6-presets-and-art-direction) · [Rendering](#7-rendering-model) · [Architecture](#8-implementation-architecture) · [Recipe model](#9-project-model-persistence-and-reproducibility) · [Export](#10-export-contract) · [Service API](#11-hosted-service-and-optional-api) · [Testing](#13-validation-plan-and-acceptance-criteria) · [Codex prompt](#16-ready-to-use-prompt-for-codex)

## 1. Product decision

Build an interactive photo-finishing editor. The user chooses a photograph, selects a starting look, adjusts the photographic treatment and simulated physical materials, compares the result, and exports it.

The first release should process images locally in the browser. It can still be offered as a hosted web service, while avoiding image-upload infrastructure and per-render API costs. Design a reusable renderer so a server rendering API can be added later.

The effect should preserve the user's subject and source-image detail. A generative image model is not required for the core product. Image regeneration would make fine controls less predictable and could change faces, lettering, objects, or composition.

Working product name: **Handmade Photo Studio**. Treat this as a placeholder.

### Assumptions resolved for this specification

- Primary use: one image transformed into a paper print.
- First-release output: digital images suitable for sharing or further design work.
- Primary device: desktop; touch-friendly controls and a lower-resolution mobile mode.
- Default look: restrained monochrome printing on warm, fibrous paper.
- Colour film and B&W are first-class workflows. B&W has its own independent group and strength control.
- No login, cloud storage, paid model API, or subscription infrastructure is required for the first working release.
- A torn-strip mode and fragmented-grid mode belong in the first complete release.
- Arranging several separately uploaded photographs is a second-release capability.
- The initial controls are proposed design values, not measurements of the artist's actual production settings.

### The product promise

**Turn a photograph into a tactile paper artwork, and control how much of each treatment you see.**

The engine can create the appearance of a physical print. It cannot automatically supply the original photographer's subject selection, timing, emotional associations, or relationships between different photographs.

## 2. What the references establish

The research combined the nine supplied photographs, selected public Instagram posts, and the artist's own portfolio and print descriptions.

### 2.1 Verified reference index

| Reference | Evidence | Product implication |
|---|---|---|
| [10×15 project](https://www.tarasperevarukha.com/projects/10x15) | Small-format works on handmade Japanese paper; the supplied foam-like image with a white semicircle appears in the project. | Treat paper, physical scale, irregular edges, and image as one object. |
| [10×15 arrangement, September 12](https://www.instagram.com/tarasperevarukha/p/DdL2MnnAGjv/) | Mixed vertical and horizontal prints arranged together; the caption explains the intimate scale and handmade paper. | Later support free arrangements of multiple prints. |
| [Wave, Miami, Florida 2024](https://www.tarasperevarukha.com/prints/p/wave-miami-florida-2024) | Archival pigment inks on handmade Japanese kōzo paper; 10 × 15 cm. | Pigment-on-paper simulation is a justified material direction. |
| [Starlings, Brighton 2024](https://www.tarasperevarukha.com/prints/p/starlings) | Archival pigment printing on handmade kōzo. | Fine bright details should survive against dark printed areas. |
| [Confluence, August 20](https://www.instagram.com/tarasperevarukha/p/DcQcrBggNBA/) | Exact supplied sky/branches/reflection triptych. Its caption identifies it as Confluence. | Torn edges and negative gaps should be separate controls. |
| [Confluence, September 5](https://www.instagram.com/tarasperevarukha/p/Dc8ZelyAKOM/) | Another three-part arrangement, with branches, a tree, and bright scattered circles. | Sequencing and visual relationships matter independently of surface effects. |
| [Two clouds, August 26](https://www.instagram.com/tarasperevarukha/p/DcgsCvngLwl/) | Exact supplied flock/landscape pair. | Similar silhouettes connect different pictures. This needs multiple inputs or manual composition, not a filter. |
| [Fragments](https://www.tarasperevarukha.com/projects/fragments) | A photograph is divided into pieces; each piece is toned individually by hand. | Add a grid mode with controlled, seeded tone variation per fragment. |
| [Cornwall, 2024](https://www.tarasperevarukha.com/prints/p/solitude-photopolymer-gravure) | Hand-pulled photopolymer gravure on Somerset Satin 300 gsm paper. | A separate gravure-inspired treatment is useful; do not label every output as an actual gravure. |
| [Inner November](https://www.tarasperevarukha.com/prints/p/book-inner-november) | Handmade kōzo, archival pigment printing, Japanese hand stitching, 30 spreads. | Paper margins, sequencing, and book presentation are relevant later. |
| [Artist statement](https://www.tarasperevarukha.com/about) | The artist describes photographs developing through material, scale, and viewing; displacement informs his practice. | Offer deliberate composition and material controls rather than a decorative border alone. |
| [Artist interview](https://www.lomography.com/magazine/359340-creators-in-focus-intersecting-material-time-and-image-peering-into-taras-perevarukha-s-photographic-process) | Discussion of small formats, material choices, and handmade production. | Prioritise close inspection and useful detail views. |

These sources establish particular materials and practices. The rendering algorithms below are our proposed digital approximations, not a reconstruction of undisclosed studio methods.

### 2.2 Unconfirmed details

Do not present the following as established facts:

- The specific manufacturer or grade of paper in each supplied photograph.
- Whether an individual edge is naturally deckled, dry-torn, or water-torn.
- How the white semicircle in the first work was produced.
- The exact inks, toning substances, curves, camera settings, or grain treatment.
- Whether the black “echo of a dream” cover uses traditional momigami.
- Whether the supplied black cover belongs to any particular book listed on the current website.
- Whether every photographic composition was made entirely in-camera.

Use these uncertainties to keep the product vocabulary accurate. “Kōzo-inspired paper” and “gravure-inspired finish” describe simulations. Do not claim the digital file is a handmade physical print.

### 2.3 Mapping the supplied images

| Attachments | What they show | Features the service can reproduce |
|---|---|---|
| 1, 2, 3 | Close and full views of branching pale texture and a white semicircle on a dark sheet. | Textured printed surface, irregular sheet outline, paper fibres, tonal contrast, shallow shadow. |
| 4 | Dark, wrinkled cover with small type and exposed fibrous material at the left. | Wrinkling, directional surface shading, paper character. Binding and typography are separate composition features. |
| 5, 9 | Three photographic strips separated by bright torn gaps. | Strip layout, torn boundaries, exposed fibres, gap width, coherent tonal treatment. |
| 6, 8 | Pair of bordered prints: a flock and an isolated landscape form. | Soft irregular outline, inner border, matte surface, presentation spacing. |
| 7 | Close view of the landscape print. | Surface relief in light areas, fine image grain, subdued distant tones. |

### 2.4 The aesthetic, decomposed

**Photographic tone:** Mostly monochrome, with selective contrast. A quiet sky can coexist with a dense black landform. “Moody” should not mean indiscriminately crushing every shadow.

**Image grain:** Fine, irregular variation that belongs to the photographic image. It must be controllable separately from the paper.

**Ink behaviour:** Edges are slightly softened and density varies subtly with the support. Dark areas remain rich, but do not resemble glossy plastic.

**Paper body:** Warm or neutral fibres, broad low-contrast mottling, small surface variations, occasional creases.

**Edges:** A believable outline combines large, gentle irregularity with smaller breaks and fine fibres. Uniform zigzags or a blurred rectangle will not produce the same effect.

**Lighting and object depth:** Small contact shadows and local surface shading communicate thickness. The object usually looks nearly flat.

**Composition:** The image may fill the sheet, sit inside a pale margin, or be divided into pieces. Empty areas and gaps are active design choices.

**Presentation:** White and near-black surroundings change how paper, gaps, and blacks are perceived. The export background must be distinct from the editor's workspace.

### 2.5 Features that must not become automatic “style” decorations

Do not automatically add moons, birds, trees, scratches across faces, handwriting, signatures, book titles, or an invented artist mark.

A circle in a reference may be a photographed subject, an unprinted region, or an added element. Its presence does not make a white circle an appropriate default filter component.

The artist's images are research references. Use original, user-provided, public-domain, or properly licensed photographs and texture assets in the shipped product.

## 3. Scope and release boundaries

### Release 1: complete working editor

- JPEG, PNG, and static WebP input.
- A locally processed image and live canvas preview.
- Source crop, fit, zoom, pan, and reset.
- Single-sheet, torn-strip, and fragmented-grid layouts using one source image.
- All Release 1 controls in Section 5, including controls disclosed under “Advanced”.
- Six curated artwork presets, fourteen film-inspired profiles, and seven paper material recipes, with editable values.
- Dedicated B&W filters, colour-to-grey mixer, print contrast and toner.
- Film response, colour character, grain, development character, halation and bloom controls.
- Procedural materials plus captured/hybrid material-map support and a small licensed/original material library quality gate; see the companion's Section 7.3.
- Object, flat print-face and image-only preview/export views.
- Deterministic texture, edge, and fragment variation.
- Per-group bypass/reset, undo/redo, and before/after comparison.
- PNG and JPEG export, transparent surroundings for PNG, and exact pixel dimensions.
- Settings-only JSON export/import and opt-in browser project saving.
- Responsive editor, accessible controls, capability checks, and clear error states.
- A useful fallback if worker rendering is unavailable.
- Source-preserving behaviour: the original file is not overwritten.

### Release 2

- Multiple input photographs, an ordered triptych, a diptych, and free arrangement.
- Per-print cropping, tone overrides, movement, rotation, and overlap.
- Placement tools for explicit user-created shapes or labels.
- Expanded material library and measured film calibration beyond the first release's captured-material support and approximate profiles.
- More advanced paper curling, edge lift, and true mesh displacement.
- Book-spread presentation and sequencing.
- Batch processing, downloadable project packages, cloud projects, and public sharing.

### Release 3 / optional commercial service

- Authenticated rendering API, large-output jobs, higher-bit-depth output, and managed storage.
- Paid access, batch automation, team libraries, print fulfilment.
- Generative restyling or semantic composition assistance as a separate opt-in feature, if later requested.

Do not expose nonfunctional controls for later releases. An unfinished feature may be documented, but must not masquerade as a working tool.

## 4. User journey and interface

### 4.1 Primary journey

1. Open the editor.
2. Choose a local image or a bundled licensed sample.
3. See the default “Quiet Paper” preset applied.
4. Adjust the overall strength or individual groups.
5. Choose full-sheet, strips, or fragments.
6. Inspect the full composition and a detail at 100%.
7. Compare with the source or the clean version of the current layout.
8. Export the artwork, optionally with settings.

Default adjustments should be immediate and restrained. The user should not need to understand printing chemistry or graphics programming.

### 4.2 Desktop layout

- Top bar: image name, replace image, undo, redo, compare, export.
- Left rail: presets and layout choices.
- Centre: large image canvas, fit/100% zoom, pan, background preview.
- Right inspector: collapsible effect groups, overall strength, group toggles, numeric values.
- Bottom status: preview state, output dimensions, zoom, and local-processing status.

Show the most meaningful controls first. Keep advanced controls collapsed without making them inaccessible. Use muted interface colours and a neutral workspace; the artwork should dominate.

Separate Artwork presets, Film profiles and Paper materials. Show Film response, Grain amount, Black & white and Paper character as distinct strengths. Source / Photo treatment / Final artwork comparison views do not mutate the recipe. Provide an optional 100% material detail viewport and a temporary light-sweep inspection gesture that restores the saved light on release.

### 4.3 Mobile layout

- Canvas above a bottom inspector.
- Horizontally selectable effect groups.
- Large sliders, labelled numeric inputs, and reliable touch panning.
- Clear distinction between moving the picture and scrolling the controls.
- Lower preview resolution when needed, while retaining the same saved recipe.
- An export-size cap based on measured capability, with an explanation if an option is unavailable.

### 4.4 Interaction rules

- Slider drags show a fast preview; releasing a slider requests a refined render.
- Show each numeric value and allow keyboard editing.
- Treat one continuous drag as one undo operation.
- Bypassing a group preserves its values; re-enabling restores them.
- Resetting a group restores the neutral values, not an unrelated preset.
- “Reset to preset” is a separate action.
- Applying a preset preserves the uploaded image, crop, output size, and layout unless the user explicitly selects “Apply layout too”.
- Randomise changes only the chosen group's seed.
- Compare is a momentary preview operation; it does not enter undo history.
- An export uses an immutable snapshot of the recipe at the time Export was clicked.
- Changing a control while exporting changes the live preview, not the running export.
- Replacing an image retains the finish; show a new crop rather than silently reusing an unsuitable old crop.
- Files and recipe imports are data. Text or metadata inside them must not control application behaviour.

## 5. Complete control specification

### 5.1 Value and strength conventions

The control table values are UI units. Store them consistently; do not mix UI percentages with normalised numbers without a conversion layer.

- Strength: 0–100, where 0 disables that group's contribution.
- Signed adjustments: neutral 0; both positive and negative values are meaningful.
- Percent of sheet: measured against the paper's shorter side before outer stage padding.
- Degrees: saved in degrees and converted once for rendering.
- Millimetres, if later offered, require explicit physical output size.
- Neutral numeric values are defined below. Initial presets deliberately differ from neutral.

Overall “Finish strength” multiplies each enabled finish group's strength. Scale amplitude-like adjustments away from their neutral values; keep pattern size, seed, profile, direction, and other structural descriptors fixed. This reveals more of the same pattern instead of regenerating it. Do not crossfade two differently shaped final images.

For an enabled group, its effective multiplier is (finishStrength / 100) × (group.strength / 100); a bypassed group has multiplier 0. Apply this multiplier once to the group's contribution. Leaf intensity controls still set their individual relative amounts. Structural values stay latent when the contribution is zero. Layout tear strength uses the global multiplier; fragment tone variation also respects the tone group's enabled state and strength. Explicit scatter and gap remain composition settings.

At overall strength 0:

- Photographic finish is neutral inside the chosen source crop.
- Texture, grain, ink variation, raggedness, wrinkles, and simulated lighting vanish.
- Intentional layout remains: crop, sheet dimensions, inner border, number of pieces, gaps, and stage background.
- A strip layout therefore becomes straight-edged strips.
- A separate “View source” comparison shows the original without the composition.

This gives a precise meaning to zero without undoing the user's layout.

### 5.2 Global and composition controls

| Key | UI label | Range / neutral | Meaning |
|---|---|---|---|
| finishStrength | Finish strength | 0–100 / 100 | Multiplier for all enabled finish groups. |
| layout.mode | Layout | single, strips, grid / single | Arrangement of one source image. |
| composition.fit | Image fit | contain, cover / contain | Preserve full image with border or crop to fill the image area. |
| composition.crop | Crop | normalised rectangle / full image | Source coordinates after orientation correction; edited through a crop tool. |
| composition.borderPct | Image border | 0–15 / 0 | Unprinted inset, independent of edge raggedness. |
| composition.aspect | Paper proportions | source, 1:1, 3:2, 2:3, 4:5, custom / source | Nominal overall paper bounds. |
| composition.shortSideMm | Paper reference size | 50–600 mm / 150 | Virtual short-side size for material sampling and thickness; does not set export DPI. |
| stage.paddingPct | Surrounding space | 0–30 / 8 | Stage space outside the paper arrangement. |
| stage.background | Background | transparent, solid / solid | Export surroundings. |
| stage.colour | Background colour | colour / #F3F0E9 | Solid surroundings; independent of editor workspace colour. |
| output.view | Export view | object, flat, image / object | Artwork object, flat print face, or photographic image only; see Section 10.5. |

### 5.3 Tone

| Key inside tone | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Tone strength | 0–100 / 100 | Scales this group from neutral. |
| exposureEv | Exposure | −2 to +2 EV / 0 | Input exposure before film response; other basic tone controls act after film/B&W/grain. |
| contrast | Contrast | −100 to +100 / 0 | Smooth tonal separation, with controlled endpoints. |
| shadows | Shadow detail | −100 to +100 / 0 | Negative darkens; positive opens dark midtones. |
| highlights | Highlights | −100 to +100 / 0 | Negative compresses; positive brightens upper tones. |
| blackLift | Matte blacks | 0–100 / 0 | Raises the deepest output black subtly without flattening the whole image. |
| warmth | Print warmth | −100 to +100 / 0 | Cool to warm tone of the image; separate from paper colour. |
| detailSoftness | Image softness | 0–100 / 0 | Small-radius softening of photographic detail, not paper edges. |

Avoid a compulsory vignette. It is not a consistent defining feature of the reference set.

B&W now belongs to `bw` (Section 5.13). Schema 2 has no `tone.monochrome`; migrate old recipes as specified in Section 9.4.

### 5.4 Photographic grain

| Key inside grain | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Grain strength | 0–100 / 0 | Grain amplitude. |
| size | Grain size | 1–100 / 35 | Fine-to-coarse image grain at fixed relative scale. |
| clustering | Grain clustering | 0–100 / 20 | Slightly grouped grains rather than uniform digital noise. |
| shadowBias | Grain in shadows | −100 to +100 / 0 | Redistributes grain by image luminance without changing average brightness. |
| chroma | Grain colour | 0–100 / 0 | Colour-channel variation; suppressed at full B&W before print toning/material colour. |
| format | Film format feel | 35mm, medium, large / 35mm | Virtual grain scale using 24, 56, 102 mm short sides; no crop/framing change. |

Grain supports scalar B&W and correlated colour variation. Its spatial pattern belongs to the full oriented source before crop, so splitting one image must not restart grain on every fragment. Film profiles recommend values for this one engine; they must not add a second hidden grain layer. See the companion, Section 5.3.

### 5.5 Ink / printed-image response

| Key inside ink | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Ink character | 0–100 / 0 | Overall strength of this material response. |
| spread | Ink softness | 0–100 / 0 | Slight spread of printed marks, limited to the image area. |
| densityVariation | Uneven ink | 0–100 / 0 | Low-amplitude density variation coupled to paper texture. |
| coverageLoss | Dry areas | 0–100 / 0 | Sparse places where paper shows through the image. |
| gravureGrain | Gravure character | 0–100 / 0 | Irregular density pattern inspired by gravure, separate from film grain. |
| paperCoupling | Texture affects ink | 0–100 / 50 | Blends independent and paper-correlated density/coverage fields; requires nonzero density variation or dry areas. |

Strong dry areas or gravure character are creative extremes. Default presets should keep them subtle.

### 5.6 Paper surface

| Key inside paper | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Paper character | 0–100 / 0 | Scales paper colour departure and surface fields. |
| profile | Paper type | soft-kozo, cotton, smooth, cold-press, baryta, lustre, creased-kozo / soft-kozo | Material model identity. See companion Section 7.1 for material recipes. |
| colour | Paper colour | colour / #FFFFFF | Substrate colour visible in borders, fibres, and light image regions. |
| tooth | Surface texture | 0–100 / 0 | Fine physical relief. |
| mottling | Paper variation | 0–100 / 0 | Broad, low-contrast changes in paper density/albedo. |
| fibres | Visible fibres | 0–100 / 0 | Long, sparse internal fibres. |
| fibreSize | Fibre size | 1–100 / 35 | Relative thickness and length of internal fibres. |
| assetMix | Captured texture | 0–100 / 0 | Mix captured map fields with procedural counterparts; available only when an asset supplies the required map. |
| textureScale | Texture scale | 0.25–4 / 1 | Multiplier of declared material feature size; stable across output sizes. |
| rotationDeg | Fibre direction | 0–360 / 0 | Rotates the coordinated map set and normal vectors together. |
| sheen | Surface sheen | 0–100 / 0 | Dielectric reflection strength; requires active lighting. |
| roughness | Reflection softness | 1–100 / 85 | Width/breakup of reflected light; structural, only visible with sheen and lighting. |
| thicknessMm | Paper thickness | 0–1.5 mm / 0.35 | Virtual sidewall/contact cue, separate from the sheet's lift above the stage. |

Paper intensity must not look like a uniform grey veil over the photograph. The surface should remain perceptible in highlights without destroying black density.

Store optional `paper.assetId` and `paper.assetVersion` as nullable strings, separate from the material-family ID. Asset maps are optional inputs to the material model, not a finished lighting overlay. `assetMix` selects field content; the existing tooth/mottling/fibre amplitudes and paper strength still control their effect once. Scale and rotation are structural. Sheen and thickness cues vanish with zero effective paper or lighting strength. Zero paper strength remains a flat neutral white support; independent wrinkles may still affect that support through the wrinkle group.

### 5.7 Paper perimeter

| Key inside edges | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Edge character | 0–100 / 0 | Overall perimeter deformation and fibrousness. |
| profile | Edge style | deckled, torn, clean / deckled | Different shape distributions. |
| irregularity | Uneven outline | 0–100 / 0 | Large-scale variation of the sheet contour. |
| roughness | Small edge detail | 0–100 / 0 | Smaller bites and local variation. |
| featherWidth | Soft edge width | 0–100 / 0 | Thin fibrous transition; not a broad Gaussian blur. |
| looseFibres | Loose fibres | 0–100 / 0 | Sparse fine strands outside the main paper body. |

The outline is calculated for the paper, not for the source image's rectangular bounding box. Edge colour must follow local material and ink coverage, including full-bleed dark edges.

### 5.8 Wrinkles

| Key inside wrinkles | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Wrinkle strength | 0–100 / 0 | Depth of shallow paper creases. |
| scale | Wrinkle size | 1–100 / 50 | Fine crumpling through broad shallow creases. |
| density | Wrinkle density | 0–100 / 30 | Number of crease families. |

Release 1 uses a height-field approximation for shallow wrinkles. True folds, overlapping paper, and large curling corners are outside this model.

### 5.9 Lighting and depth

| Key inside lighting | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Light & depth | 0–100 / 0 | Scales physical shading and shadow opacity. |
| azimuthDeg | Light direction | 0–360 / 315 | One shared illumination direction. |
| relief | Surface relief | 0–100 / 0 | Visibility of tooth and wrinkle shading. |
| shadowOpacity | Paper shadow | 0–100 / 0 | Opacity of the external contact/cast shadow. |
| elevation | Paper lift | 0–100 / 0 | Small distance above the background; controls offset and softness coherently. |
| altitudeDeg | Light height | 15–85 degrees / 50 | Angle above the sheet, shared by normals and shadow direction/length. |
| softness | Light softness | 0–100 / 50 | Apparent area-light size; controls cast-shadow softness and broadens reflections. |

Lighting must use the same direction for surface highlights and cast shadow. Shadow is derived from the paper mask, including its irregular outline.

Relief needs paper tooth or wrinkles to have an effect. Inactive dependencies receive a brief contextual explanation; do not silently produce unrelated shading.

### 5.10 Strip and grid composition

| Key inside layout | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| stripCount | Number of strips | 2–5 / 3 | Count in strips mode. |
| direction | Split direction | horizontal, vertical / horizontal | Direction of cuts across the original image. |
| cutPositions | Split positions | ordered normalised positions / evenly spaced | Optional draggable cut lines; count always equals stripCount − 1. |
| rows | Grid rows | 2–6 / 4 | Used in grid mode. |
| columns | Grid columns | 2–6 / 4 | Used in grid mode; maximum 36 pieces. |
| gapPct | Gap size | 0–6 / 1.5 | Spacing between pieces, as percentage of nominal short side. |
| tearAmount | Torn inner edges | 0–100 / 0 | Raggedness along cuts; multiplied by finishStrength. |
| toneVariation | Fragment tone variation | 0–100 / 0 | Bounded per-piece warmth/density variation; multiplied by finishStrength and tone strength. |
| scatter | Alignment variation | 0–100 / 0 | Small stable translation/rotation around the base arrangement; composition control. |

Modes have different semantics:

- **Strips:** split one continuous photograph into corresponding parts, then separate them.
- **Grid:** split one continuous photograph into a rectangular mosaic; vary each piece's finish if requested.
- **Multiple photographs:** a later explicit mode. Never duplicate one full image into every tile and present that as a continuous split.

For Release 1, each piece remains linked to one shared source transform. Independent source crops per tile would break continuity and belong to the later collage mode.

### 5.11 Control dependency and audit contract

Every numeric effect control must have a registry entry containing:

- Stable key, label, neutral value, minimum, maximum, and step.
- Group, description, and any prerequisite.
- A conversion from UI units to physical/render parameters.
- A list of renderer resources/passes it invalidates.
- Whether it is a finish or composition control.
- Whether it changes amplitude, structure, colour, or placement, so strength multipliers are applied correctly.
- A deterministic seed namespace where appropriate.
- A test fixture on which its effect can be observed.

Examples:

| Changed control | Recalculate | Preserve |
|---|---|---|
| tone.exposureEv | Image tone and dependent image-material composition | Paper outline, random fields, source crop. |
| grain.size | Grain sampling/filtering | Its seed and source-image coordinate origin. |
| paper.colour | Material colour and composition | Edge geometry and image crop. |
| edges.irregularity | Mask, edge fibres, shadow, bounds | Image processing and unrelated material seeds. |
| lighting.azimuthDeg | Material lighting and cast shadow | Tone, texture fields, geometry. |
| layout.gapPct | Piece placement and stage fit | Source partition boundaries, printed detail, seeds. |
| layout.toneVariation | Per-fragment colour/density response | Tile positions and torn boundaries. |

Changing one aspect may affect physically dependent results, such as a new edge shape changing its shadow. That is different from silently changing unrelated settings.

### 5.12 Film response

| Key inside film | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Film response | 0–100 / 0 | Scales curve, colour character, development and highlight effects once; independent of grain and B&W. |
| profile | Film profile | none plus fourteen IDs in the companion / none | Chooses a versioned response. Profile selection loads its film/grain/B&W recipe in one visible, undoable action. |
| responseMix | Film tones | 0–100 / 100 | Neutral-axis curve contribution. The none profile is identity. |
| colourMix | Film colours | 0–100 / 100 | Hue/chroma response, independent of the neutral curve; inactive for B&W profiles. |
| balance | Film colour balance | −100 to +100 / 0 | Cool-to-warm creative input balance in the film branch, separate from finishing print warmth. |
| development | Development character | −2 to +2 / 0 | Pull-like to push-like curve/grain modulation; no hidden exposure change or invented shadow detail. |
| halation | Highlight halo | 0–100 / 0 | Narrow source-highlight scattering; reddish for colour, achromatic after full B&W. |
| halationRadius | Halo size | 1–100 / 35 | Stable source-space kernel support, not final output pixels. |
| halationThreshold | Halo threshold | 0–100 / 80 | Soft threshold against exposed source reference white, before adding halo. |
| bloom | Soft glow | 0–100 / 0 | Broader, largely neutral source-highlight glow. |
| bloomRadius | Glow size | 1–100 / 55 | Independent broad kernel support. |
| bloomThreshold | Glow threshold | 0–100 / 80 | Independent soft threshold for broad glow; does not change the halo mask. |

Store `film.profileVersion` alongside the profile ID (initial value `1`). Profile family and authored transform assets are resolved from a pinned registry. The none profile bypasses stock-specific curves/colour and development; explicit highlight controls and balance may still be used creatively. A stock selection loads strength 100, mixes 100, normal development, neutral balance except the proposed Tungsten Night balance −25, and the grain/halo recommendations in companion Section 4. It does not reset basic tone, paper or layout.

Colour/curve response, halation and bloom are independently disableable through their leaf amounts. Overall Finish is not multiplied twice by two nested film strengths. Development's modulation of active grain is 1 at film strength 0; no film setting creates grain while the grain group is bypassed.

### 5.13 Black and white

| Key inside bw | UI label | Range / neutral | Visual responsibility |
|---|---|---|---|
| strength | Black & white | 0–100 / 0 | Blends the monochrome candidate into the photographic image; independent of basic tone and film strength. |
| filter | Lens filter look | none, yellow, orange, red, green, blue / none | RGB approximation of relative colour sensitivity; evaluated before grey conversion. |
| filterAmount | Filter strength | 0–100 / 100 | Interpolates from neutral sensitivity to the chosen filter. |
| mixer.red | Reds | −100 to +100 / 0 | Brighten/darken red input hues in the monochrome candidate. |
| mixer.yellow | Yellows | −100 to +100 / 0 | Brighten/darken yellow input hues. |
| mixer.green | Greens | −100 to +100 / 0 | Brighten/darken green input hues. |
| mixer.cyan | Cyans | −100 to +100 / 0 | Brighten/darken cyan input hues. |
| mixer.blue | Blues | −100 to +100 / 0 | Brighten/darken blue input hues. |
| mixer.magenta | Magentas | −100 to +100 / 0 | Brighten/darken magenta input hues. |
| printContrast | B&W print contrast | −100 to +100 / 0 | Smooth monochrome curve; creative grade, not calibrated darkroom filter numbers. |
| toner | Print tone | neutral, sepia, cool, selenium / neutral | Proposed image-toning colour family; does not alter paper colour. |
| tonerAmount | Toner strength | 0–100 / 0 | Subtle-to-strong image toning; neutral toner always does nothing. |

Apply the B&W group's effective multiplier once when blending the complete conversion/mixer/grade/toner candidate. Do not multiply it again into every internal colour-to-grey adjustment. The B&W toggle is `bw.enabled`; disabling it preserves latent settings. Chromatic grain is attenuated by the same effective monochrome amount, so full B&W cannot acquire coloured speckles from the grain stage. Basic print warmth, a toner or warm paper can intentionally tint the final result.

Filter weights and six smooth hue-band rules are in companion Section 6. Neutral greys must remain stable under colour-filter/mixer changes. Disable/explain hue controls on an already achromatic source. More detailed material/film parameters belong in Advanced, not the default inspector.

## 6. Presets and art direction

Presets are versioned recipes with plain-language names. They are starting points for the user's image, not promises to reproduce a specific artwork.

Values below are UI units. Unspecified adjustments use the neutral values from Section 5. For active groups, use these explicit values; set unspecified group strengths to 0. Random seeds are fixed preset data.

| Preset | Tone | Material and edge settings | Layout |
|---|---|---|---|
| Quiet Paper | Tone 100; B&W 100; contrast 8; blackLift 8; warmth 8 | Paper 65, tooth 24, mottling 12, fibres 18, colour #F3EEDC; ink 35, spread 10, densityVariation 12; edges 60, irregularity 20, roughness 25, featherWidth 25, looseFibres 18; lighting 35, relief 22, shadowOpacity 20, elevation 12 | Single, border 3%. |
| Dark Print | Tone 100; B&W 100; exposureEv −0.15; contrast 22; shadows −10; blackLift 4; warmth 4 | Paper 55, tooth 20, fibres 12, colour #ECE8DC; ink 45, spread 12, densityVariation 18; grain 20; edges 45, irregularity 18, roughness 22, featherWidth 18; lighting 25, relief 15, shadowOpacity 18, elevation 10 | Single, border 0%; optional near-black stage #191919. |
| Torn Sequence | Tone 100; B&W 100; contrast 12; warmth 6 | Paper 60, tooth 20, fibres 20, colour #F5F1E7; ink 30, spread 8, densityVariation 10; edges 40, irregularity 12, roughness 20, featherWidth 25, looseFibres 15; lighting 20, shadowOpacity 15, elevation 8 | Three horizontal strips, gap 1.8%, tearAmount 65, border 0%. |
| Toned Fragments | Tone 100; B&W 100; contrast 10 | Paper 50, tooth 20, mottling 12, colour #F0EBDD; ink 35, densityVariation 18; edges 25, irregularity 8, roughness 12; lighting 20, shadowOpacity 16, elevation 8 | 4 × 4 grid, gap 0.8%, toneVariation 25, scatter 0. |
| Soft Gravure | Tone 100; B&W 100; contrast 18; blackLift 6; detailSoftness 12 | Paper 40, profile cotton, tooth 18, colour #F4F0E6; ink 65, spread 18, densityVariation 20, gravureGrain 35; grain 8; edges 35, irregularity 12, roughness 16 | Single, border 8%. |
| Gentle Colour | Tone 100; B&W 0; contrast −5; highlights −10; warmth 3 | Paper 45, tooth 15, mottling 8, fibres 10, colour #F7F3E8; ink 25, spread 8, densityVariation 8; edges 40, irregularity 15, roughness 20, featherWidth 15; lighting 25, relief 15, shadowOpacity 18, elevation 10 | Single, border 3%. |

Preset labels are original product labels. Do not use the artist's name as the service's brand or imply endorsement.

The six rows above are artwork presets. In schema 2, their B&W amount is `bw.strength` with `bw.enabled` true when nonzero; film response defaults off. They retain their specified grain/material values. Fourteen additional film recipes and seven material recipes are defined in the companion, Sections 4 and 7.1. A film recipe changes film/grain/B&W; a material recipe changes paper and its explicitly documented ink/wrinkle recommendations. Neither changes crop or layout. Apply each as one undo transaction and expose every changed setting.

Art-direction acceptance:

- The effect reads as printed paper at normal viewing size.
- Fine texture becomes more visible on closer inspection.
- At moderate strengths, faces and text remain recognisable.
- Default shadows suggest a thin sheet.
- The edge does not form a repetitive sawtooth or look burned.
- The finest strands are sparse and irregular, not a uniform fuzzy halo.
- Bright paper is not forced around every full-bleed black image.
- The first impression remains the photograph; texture supports it.

## 7. Rendering model

### 7.1 Architectural separation

Use one canonical recipe and four distinct representations:

1. **Source:** original encoded image plus orientation-corrected working pixels.
2. **Printed image:** source pixels after photographic tone, grain, and ink processing.
3. **Paper object:** material fields, paper mask, image-placement mask, and local lighting.
4. **Scene:** one or more paper pieces, background, shadows, and output framing.

A CSS border or CSS filter may help prototype the interface, but cannot be the final rendering system. Anything visible in the finished artwork must be rendered into the export.

### 7.2 Coordinate systems

Maintain explicit transforms between these spaces:

- Source UV: the oriented source photograph, normalised to 0–1.
- Continuous print space: the original unsplit image and its paper dimensions.
- Piece-local space: a specific strip or fragment after partition.
- Stage space: position of each piece, surrounding space, and shadows.
- Output pixels: the current preview or export resolution.

Define **1,000 design units per nominal paper short side**. Grain scale, fibres, edge amplitudes, blur support, and relief use these units, not CSS pixels or output pixels.

Changing export resolution must increase detail, not resize all the fibres or move the tears. Zooming the editor must not reseed anything.

Paper texture uses continuous print space by default when one sheet is divided. Piece-local boundary fibres and shadows are generated after splitting. In a future multiple-sheet collage, each sheet receives its own paper-space origin and seed.

### 7.3 Deterministic randomness

Use a documented integer PRNG/hash with independent seed namespaces:

- Grain.
- Paper surface and fibres.
- Outer perimeter.
- Inner tear paths.
- Wrinkles.
- Fragment tone.
- Fragment placement.

Derive sub-seeds from the saved seed, a stable piece ID, and a namespace. Do not use the clock or an unseeded random call in a render.

Stable fields must be sampled as continuous functions of design coordinates. Increasing amplitude should reveal more of the same structure; it should not generate a different pattern.

Changes to piece count may create a new partition, but moving a gap or changing exposure must not do so. Retain existing piece IDs when the partition topology has not changed.

For exact reproducibility record recipe schema, renderer version, asset versions, and seeds. Same-build repeated output should be stable. Different browsers or GPU implementations may differ slightly in numerical results; do not promise bit-for-bit equality across every device.

### 7.4 Render sequence

~~~text
Validate input and dimensions
  -> Decode and correct orientation once
  -> Normalise working colour and alpha convention
  -> Resolve source crop and nominal paper dimensions
  -> Build continuous material fields
  -> Apply basic input exposure and effective film balance
  -> Extract source highlight masks and add halation/bloom
  -> Apply colour film response if a colour profile is selected
  -> Apply one B&W conversion/filter/mixer/grade/toner branch
  -> Apply B&W film luminance curve if a B&W profile is selected
  -> Apply one source-space grain engine and remaining basic tone
  -> Branch to image-only output here when requested
  -> Construct strip/grid partitions, if active
  -> Apply bounded per-fragment tone offsets
  -> Apply image softness, ink spread, and ink/paper interaction
  -> Build each paper body, image-placement mask, and edge fibres
  -> Apply shallow diffuse/specular surface lighting, unless flat export
  -> Place pieces and render their shadows
  -> Composite onto solid or transparent stage
  -> Convert to output colour/alpha representation
  -> Encode preview or exported file
~~~

The logical order does not require one GPU pass per step. Fuse compatible operations and cache reusable resources. Keep the same logical ordering for preview and export.

### 7.5 Colour and alpha contract

- Release 1 targets an SDR sRGB output.
- Make input colour conversion explicit in the decoder wrapper.
- Normalise embedded-profile images through a tested sRGB decode/canvas path; avoid silently reading wide-gamut encoded values as sRGB.
- Treat HDR and professional colour-managed print workflows as unsupported in Release 1.
- Convert working sRGB values to linear light for physical mixing and lighting.
- A perceptual tone curve may operate in a deliberately chosen perceptual domain; name that domain and convert at its boundaries.
- Use one documented premultiplied-alpha convention for filtered/composited surfaces.
- Colour adjustment should operate on unassociated RGB where needed, then premultiply again before interpolation/composition.
- Avoid applying alpha twice. At zero alpha, prevent undefined RGB from producing coloured fringes.
- Convert to sRGB once at the final colour boundary.
- Do not accidentally apply both shader gamma encoding and an equivalent framebuffer conversion.

For source PNG transparency, composite the source over the chosen paper within the image area. Transparent input pixels reveal paper; they do not punch holes through it.

Texture and printed-image masks are different:

- Paper mask defines where the physical sheet exists.
- Image mask defines the border/crop area receiving the photograph.
- Source alpha defines the source image's contribution within that area.
- Stage alpha defines what remains transparent outside the sheet and optional shadow.

The image border does not need to follow every tooth in the outer contour. It can be a regular inset inside an irregular sheet.

### 7.6 Tone treatment

A neutral B&W basis in linear sRGB is shown below. Exposure precedes film response. B&W filters/mixer operate on chromatic input before conversion; basic finishing tone follows film/B&W/grain. See companion Section 6.3 for the two film-family branches.

~~~text
Cexposed = Csource * 2 ^ effectiveExposureEv
Yneutral = dot(Cexposed, [0.2126, 0.7152, 0.0722])
BWcandidate = selectedSensitivityAndFilterThenMixerGradeToner(Cphotographic)
Cbw = mix(Cphotographic, BWcandidate, effectiveBwStrength)
~~~

Apply exposure and the compressive tone curve before clipping to the output range. Do not store an intermediate clipped result that destroys recoverable highlights.

Use smooth luminance masks for shadows and highlights; avoid piecewise steps that create bands. Warmth should introduce a restrained colour relationship, with exact neutral behaviour at zero.

Image softness should use a small kernel whose size is derived from design units. It must not become an arbitrary blur of the final paper object.

### 7.7 Grain

Use band-limited stochastic grain with controlled clustering and density-conditioned variance. The visible scale must remain stable between preview and export. Calibrate mean tone after any nonlinear density transformation; zero-mean noise in density does not guarantee zero mean in reflectance.

Modulate amplitude by a smooth function of source luminance. Grain should be clipped to printed image contribution, not the blank border.

At low preview resolution, suppress frequencies above the pixel sampling limit. Refined export can resolve additional fine detail without changing its phase or the underlying pattern.

Avoid a single tiled noise bitmap stretched across every image. If a texture asset is used, its repetition, scale, and sampling must be deliberate.

Follow companion Section 5.3 for colour covariance, full-B&W chroma suppression, virtual format scaling and the source-before-crop coordinate rule. Film profile grain recommendations populate this one grain engine. Profile strength does not secretly enable or disable it.

### 7.8 Paper and ink interaction

Construct a material from separate fields:

~~~text
H = fine tooth height + broad undulation + independent crease height
P = effective paper colour + restrained albedo variation
F = sparse internal fibre field
Q = roughness/coating field
N = surface normal from H and/or aligned normal maps
~~~

H is geometric relief; P and F affect the visible material. They should not be the same noise field multiplied repeatedly.

Captured fields blend with corresponding procedural fields before amplitude controls are applied. Decode colour maps as colour and normal/height/roughness as data. Document the normal-map convention and linear units. Missing channels use an explicit procedural fallback. Apply transforms consistently across every channel; preserve the same material under relighting. The complete material/capture model is in companion Section 7.

A starting appearance model for printed colour is:

~~~text
T = tone-processed, grain-processed image reflectance
P = effective substrate reflectance
R = P * T
Rdry = mix(R, P, localCoverageLoss)
~~~

This is an artistic approximation, not a full spectral model of ink and paper. At neutral paper and ink settings, the photographic result must pass through unchanged.

For object view, illuminate the resulting diffuse print reflectance and add a bounded dielectric coating response using N and Q. Sheen controls amplitude, roughness controls width/breakup, and area-light softness affects broadening. Preserve dark ink density under diffuse lighting; a specular highlight may brighten it locally. Flat view omits directional lighting, coating highlights, sidewalls and cast shadows. Image view branches before all ink/paper interaction.

Density variation can be applied in an optical-density representation, with safe bounds around zero, rather than indiscriminately adding white noise. Its field should correlate moderately with paper structure without duplicating every fibre as a dark line.

Ink spread should modify the printed image within its placement mask. It must not leak into an intentionally clean border unless a future bleed control is explicitly added.

The edge-fibre material should inherit local printing where appropriate. For a full-bleed photograph, some fibres can carry dark ink; for an unprinted border, fibres take the substrate colour.

### 7.9 Deckled outer edge

Generate a continuous contour around the nominal sheet using:

- Low-frequency variation for the broad outline.
- Smaller bounded detail for local roughness.
- A thin, irregular transition zone.
- Sparse fibre strands extending from the boundary.

Use a closed path, mesh, or signed-distance representation with coherent corner transitions. Four unrelated edge noises often create conspicuous corner joins.

Suggested maximum envelope before strength scaling:

- Broad outline displacement: about 1.2% of nominal short side.
- Fine local displacement: about 0.3%.
- Sparse loose strands: generally below 0.8%.
- Values are starting design limits and require visual calibration.

Keep the contour valid. Prevent self-intersections, inward spikes that consume important image regions, and contour changes caused by output resolution.

Anti-alias the final mask at output scale. “Feather width” describes fine material structure; it is not permission to blur the entire sheet outline.

### 7.10 Torn cuts and split-image integrity

Construct every inner cut once in continuous print space. Use it to define the adjacent pieces.

In tear mode, opposing boundaries should correspond like two parts of one sheet. Do not invent unrelated zigzags on both sides. Each side can have different fine strands, but the main tear line is shared.

Separate pieces by translation after cutting; do not remove extra bands of source content just because the gap grows. Preserve source coverage except for the deliberately narrow ragged tear boundary.

The union of the undeformed source partitions must cover the selected source exactly once, without duplication. Test this with a numbered checkerboard.

Frayed paper exposed at the tear may be paler than the printed face. This is a local edge band, not a thick white stroke painted around every tile.

### 7.11 Fragment variation

For each stable fragment ID, derive bounded offsets from the layout seed:

~~~text
warmthOffset = strength * signedRandom(fragmentId, "warmth")
densityOffset = strength * signedRandom(fragmentId, "density")
paperTintOffset = strength * smallSignedRandom(fragmentId, "paper")
~~~

Keep their weighted mean near neutral so the whole image does not unexpectedly become much brighter or warmer. Limit individual deviations to preserve continuity and recognisable subjects.

Tone variation at zero means all fragments share the base finish. Placement scatter is independent.

### 7.12 Wrinkles and illumination

For Release 1, generate shallow crease networks as a height field with ridges, valleys, and varied curvature. Repeated straight scratches are not a convincing crease model.

Estimate surface normals from height gradients and shade them with one light direction plus a substantial ambient term. Texture should remain restrained in very dark printed areas.

Wrinkles can alter apparent brightness; they should not blur or smear the source. Large folds need explicit geometry and are reserved for Release 2.

Use the paper alpha mask to produce contact/cast shadows. Elevation should couple offset and softness. Keep surface lighting and shadow direction consistent.

### 7.13 Output bounds

Reserve a stable effect envelope when a layout is created, based on the permitted edge and shadow ranges. Fit this envelope plus the requested surrounding space into the output canvas.

Do not refit the entire artwork every time texture strength changes; that makes the photograph jump in size while the user drags a slider.

The envelope must include contour variation, loose fibres, and shadow support. If a future control exceeds it, recompute deliberately with visible framing feedback.

Use the same stage transform for clean-layout comparison and finished rendering. Otherwise the comparison is misleading.

### 7.14 Renderer interfaces

~~~ts
type RenderQuality = "interactive" | "refined" | "export";

interface RenderRequest {
  revision: number;
  project: ProjectV2;
  output: {
    width: number;
    height: number;
    quality: RenderQuality;
    view: "object" | "flat" | "image";
    includeBackground: boolean;
    includeShadow: boolean;
  };
}

interface RenderResult {
  revision: number;
  actualWidth: number;
  actualHeight: number;
  rendererVersion: string;
  warnings: string[];
  // Preview transport or export Blob is provided by the adapter.
}
~~~

A renderer receives a validated project snapshot. It must not read UI state directly or invent fresh seeds.

The request view defaults to the saved `project.output.view`. A preview/comparison may temporarily override it without changing the project. Image view stops after the photographic stage; flat view suppresses object-lighting passes; object view uses the complete pipeline. Include this branch and all asset/profile versions in cache keys.

## 8. Implementation architecture

### 8.1 Recommended stack

For an empty repository, start with:

- React and TypeScript for the editor.
- Vite for development and static production builds.
- Plain CSS or an existing lightweight styling system.
- A WebGL2 multipass renderer, isolated from React.
- A worker with OffscreenCanvas where the required features work.
- A main-thread WebGL2 adapter as the first fallback.
- A reduced Canvas2D/CPU preview path only if it is implemented and clearly labelled.
- IndexedDB for explicitly saved local projects.
- A small schema validator, such as Zod, for recipes and project imports.
- Vitest for numerical/data tests and Playwright for user-flow and visual checks.

These are recommendations, not pinned dependency versions. At implementation time use compatible maintained releases, inspect the repository first, and commit its package lockfile.

WebGL2 and OffscreenCanvas have documented browser support, but a browser name alone does not guarantee a usable graphics context or worker combination. Probe the actual capabilities. See [WebGL2](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext) and [OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas).

No backend, database service, or model API is necessary for this release.

### 8.2 Boundaries

| Module | Responsibility |
|---|---|
| Input service | Format sniffing, dimensions, decode, orientation, original-file lifecycle. |
| Project model | Validation, schema versioning, source references, serialisation. |
| Control registry | Ranges, neutral values, labels, dependencies, invalidation. |
| Recipe store | Current settings, history transactions, preset application. |
| Layout engine | Source partitions, piece geometry, transforms, effect bounds. |
| Material engine | Stable procedural fields and licensed texture resources. |
| Renderer | Tone, ink, material, alpha, lighting, scene composition. |
| Preview scheduler | Debouncing, latest-revision handling, quality changes. |
| Export service | Snapshot, full-size render, encoding, file metadata. |
| Persistence | Explicit local saves, project restoration, quota handling. |
| Capability service | Context, texture limits, output budget, fallback selection. |
| Editor UI | User interactions and display; never the authoritative render logic. |

### 8.3 Suggested file structure

~~~text
src/
  app/
    App.tsx
    EditorPage.tsx
  components/
    PreviewCanvas.tsx
    PresetRail.tsx
    EffectInspector.tsx
    EffectGroup.tsx
    ParameterControl.tsx
    CropTool.tsx
    CompareControl.tsx
    ExportDialog.tsx
    CapabilityNotice.tsx
  model/
    project-schema.ts
    controls.ts
    presets.ts
    film-profiles.ts
    material-profiles.ts
    migrations.ts
    history.ts
  state/
    editor-store.ts
  imaging/
    input.ts
    decode.ts
    colour.ts
    coordinates.ts
    seeded-random.ts
  layout/
    single.ts
    strips.ts
    grid.ts
    bounds.ts
  render/
    renderer.ts
    capabilities.ts
    worker-adapter.ts
    main-thread-adapter.ts
    render.worker.ts
    scheduler.ts
    resources.ts
    fields/
      paper.ts
      fibres.ts
      contours.ts
      creases.ts
    passes/
      tone.ts
      film-response.ts
      highlight-scatter.ts
      black-white.ts
      grain.ts
      ink-paper.ts
      masks.ts
      lighting.ts
      shadows.ts
      composite.ts
  export/
    export-image.ts
    export-recipe.ts
  persistence/
    local-projects.ts
  styles/
    editor.css
tests/
  fixtures/
  model/
  render/
  browser/
public/
  samples/
  textures/
ASSET_LICENSES.md
README.md
~~~

Adapt this structure to an existing project rather than duplicating established abstractions.

### 8.4 Scheduling and lifecycle

- Keep image pixels, textures, and render targets outside component state.
- Use React state/store updates for parameters, not multi-megabyte pixel buffers.
- Coalesce slider changes to at most one requested preview per animation frame.
- Keep one newest pending revision; drop outdated intermediate work.
- After a short idle interval, request refined rendering.
- Ignore a completed result whose revision is older than the latest requested state.
- Rebuild only invalidated resources.
- Stop continuous rendering when the editor is idle.
- Release old image bitmaps, object URLs, render targets, and listeners on replacement/unmount.
- Terminate workers and clear their caches when a project is closed.

If the GPU context is lost, retain the source and recipe, rebuild resources after restoration, and recover the preview. If recovery fails, explain the available fallback. The relevant event is documented in [MDN's context-loss reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event).

### 8.5 GPU capability and resource policy

Query texture, viewport, and renderbuffer limits. Check optional formats instead of assuming floating-point render targets work. Pool render targets and prefer fused passes where quality allows.

An RGBA8 baseline is acceptable if tone mapping occurs before quantisation and visible banding is controlled. Higher-precision paths can be optional; they must not be essential to opening the editor.

Keep capability code separate from the artwork recipe. A lower-end device changes preview quality, not the saved artistic parameters. These implementation constraints follow the practical concerns described in [WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).

## 9. Project model, persistence, and reproducibility

### 9.1 Data model

Every effect group stores enabled, strength, and a seed alongside its controls. Seeds may be unused for deterministic nonrandom groups such as tone. They are unsigned 32-bit integers.

Use normalised source crop coordinates after EXIF correction. Store a stable source identifier and a fingerprint for relinking. Do not put the user's image bytes or temporary object URLs inside a settings-only recipe.

Below is a complete example, based on Quiet Paper. All numbers are UI units from Section 5.

~~~json
{
  "schemaVersion": 2,
  "rendererVersion": "0.2.0",
  "source": {
    "id": "source-1",
    "displayName": "example-landscape.jpg",
    "fingerprint": null
  },
  "finishStrength": 100,
  "composition": {
    "fit": "contain",
    "crop": { "x": 0, "y": 0, "width": 1, "height": 1 },
    "aspect": "source",
    "customAspect": { "width": 3, "height": 2 },
    "borderPct": 3,
    "shortSideMm": 150
  },
  "stage": {
    "paddingPct": 8,
    "background": "solid",
    "colour": "#F3F0E9"
  },
  "output": { "view": "object" },
  "layout": {
    "mode": "single",
    "stripCount": 3,
    "direction": "horizontal",
    "cutPositions": [0.3333333333, 0.6666666667],
    "rows": 4,
    "columns": 4,
    "gapPct": 1.5,
    "tearAmount": 0,
    "toneVariation": 0,
    "scatter": 0,
    "seed": 9017
  },
  "tone": {
    "enabled": true,
    "strength": 100,
    "seed": 1,
    "exposureEv": 0,
    "contrast": 8,
    "shadows": 0,
    "highlights": 0,
    "blackLift": 8,
    "warmth": 8,
    "detailSoftness": 0
  },
  "film": {
    "enabled": false,
    "strength": 0,
    "seed": 2,
    "profile": "none",
    "profileVersion": "1",
    "responseMix": 100,
    "colourMix": 100,
    "balance": 0,
    "development": 0,
    "halation": 0,
    "halationRadius": 35,
    "halationThreshold": 80,
    "bloom": 0,
    "bloomRadius": 55,
    "bloomThreshold": 80
  },
  "bw": {
    "enabled": true,
    "strength": 100,
    "seed": 3,
    "filter": "none",
    "filterAmount": 100,
    "mixer": { "red": 0, "yellow": 0, "green": 0, "cyan": 0, "blue": 0, "magenta": 0 },
    "printContrast": 0,
    "toner": "neutral",
    "tonerAmount": 0
  },
  "grain": {
    "enabled": false,
    "strength": 0,
    "seed": 173,
    "size": 35,
    "clustering": 20,
    "shadowBias": 0,
    "chroma": 0,
    "format": "35mm"
  },
  "ink": {
    "enabled": true,
    "strength": 35,
    "seed": 211,
    "spread": 10,
    "densityVariation": 12,
    "coverageLoss": 0,
    "gravureGrain": 0,
    "paperCoupling": 50
  },
  "paper": {
    "enabled": true,
    "strength": 65,
    "seed": 317,
    "profile": "soft-kozo",
    "colour": "#F3EEDC",
    "tooth": 24,
    "mottling": 12,
    "fibres": 18,
    "fibreSize": 35,
    "assetId": null,
    "assetVersion": null,
    "assetMix": 0,
    "textureScale": 1,
    "rotationDeg": 0,
    "sheen": 0,
    "roughness": 85,
    "thicknessMm": 0.35
  },
  "edges": {
    "enabled": true,
    "strength": 60,
    "seed": 431,
    "profile": "deckled",
    "irregularity": 20,
    "roughness": 25,
    "featherWidth": 25,
    "looseFibres": 18
  },
  "wrinkles": {
    "enabled": false,
    "strength": 0,
    "seed": 557,
    "scale": 50,
    "density": 30
  },
  "lighting": {
    "enabled": true,
    "strength": 35,
    "seed": 1,
    "azimuthDeg": 315,
    "relief": 22,
    "shadowOpacity": 20,
    "elevation": 12,
    "altitudeDeg": 50,
    "softness": 50
  }
}
~~~

The runtime source registry separately records oriented width/height, media type, original Blob, preview bitmap, and decode status. A persistent local project includes the original Blob in IndexedDB only after an explicit save.

### 9.2 Validation rules

- Accept only supported schema versions; migrate known older versions.
- Reject a newer unknown version with a readable explanation.
- Require finite numbers, valid ranges, valid colour values, and supported enums.
- Require positive custom aspect dimensions and nonempty crop area.
- Keep crop inside the oriented source.
- Keep cut positions strictly ordered, away from the extreme edges, and consistent with strip count.
- Limit grid pieces to 36.
- Limit imported JSON size, for example 256 KB.
- Reject unsupported keys for this schema, or explicitly strip them with a reported import result; choose one documented policy.
- Never execute strings or follow external URLs from a recipe.
- Do not let a recipe select arbitrary shaders, JavaScript, texture URLs, or filesystem paths.

UI edits may clamp values into range. External imports should report invalid values rather than silently changing an entire recipe.

### 9.3 Save modes

**Download settings:** JSON only. Explain that the original photo is not included.

**Save on this device:** Explicitly store recipe plus original image Blob in IndexedDB. State that this is local browser storage, subject to browser clearing and quota.

**Restore settings:** Ask the user to choose the original photo if it is not already available. A filename alone is not a reliable identity check.

**Undo/redo:** Store recipe transactions, not copied image buffers. Suggested initial limit: 100 transactions. Record drag start/end as one transaction.

**Future project package:** A ZIP containing recipe, source, and asset manifest is a separate feature and requires archive validation.

### 9.4 Schema 2 migration and asset identity

Schema 2 adds `film`, `bw`, material/coating parameters, grain colour/format, virtual material scale and `output.view`. Migrate schema 1 as one validated operation: `bw.strength = old.tone.monochrome * old.tone.strength / 100`; set `bw.enabled` to the old tone enabled state; use neutral B&W filters/mixer/toner; then remove `tone.monochrome`. Preserve all other old values and seeds. Film defaults disabled, grain chroma 0, format 35mm, output object, shortSideMm 150, no captured assets, sheen 0, roughness 85, thicknessMm 0.35, light altitude 50 and softness 50. New ink paperCoupling defaults 50.

This preserves intended conversion strength at the saved setting. The new processing order and material renderer may change pixels; record the migration and renderer version instead of promising identical old renders. Reject unknown newer schema versions clearly. Validate finite values, enum membership, supported versions, all six mixer keys and material-map hash/units before rendering.

Recipes pin film/profile and captured-material versions. A registry entry identifies its authored curve/LUT and material map hashes, provenance and calibration status. Store resolved controls in the recipe; do not silently reload changing library defaults during project restoration. Missing map assets require an explicit recorded procedural fallback and user-visible status, never a mislabelled captured-paper result.

## 10. Export contract

### 10.1 Output choices

| Choice | Behaviour |
|---|---|
| PNG with background | Flatten the complete artwork onto the selected solid background. |
| PNG with transparency | Preserve paper-body alpha and optional shadow outside it. The checkerboard is never encoded. |
| JPEG | Flatten onto an explicitly selected solid colour; show the colour in the export dialog. |
| Settings JSON | Save the editable recipe, excluding the source image. |
| Image-only view | Export the cropped film/B&W photograph without paper, ink texture, borders, tears, layout gaps or shadows. Available in Release 1. |

Transparent PNG has an additional “Include shadow” switch. The alpha boundary should remain clean on both black and white receiving backgrounds.

### 10.2 Dimensions and detail

- Let the user choose exact width/height with an aspect lock.
- Default to a modest output, such as 2,400 pixels on the long side, subject to source resolution and device limits.
- Release 1 proposed upper ceiling: 4,096 pixels on either side and 12 million total pixels.
- These are application ceilings, not guaranteed capabilities for every device.
- Do not upscale by default. Base the detail warning on the source crop's effective pixels in the printed-image area.
- Offer explicit “Allow enlargement” if needed, with truthful wording that it does not create new photographic detail.
- Never silently reduce an export. If the selected dimensions fail capability or memory checks, propose a smaller size and let the user choose it.
- Apply the chosen effects at export resolution through the canonical renderer.
- Do not enlarge a low-resolution preview screenshot.

### 10.3 Encoding and metadata

Use a Blob-based export. Check the returned media type and null/error conditions; a browser can fall back to PNG if a requested encoder is unsupported.

Standard canvas encoding commonly records 96 dpi metadata. Pixel count and intended physical dimensions are separate. Do not advertise “300 dpi” unless the encoder actually writes and verifies that metadata. See [MDN's toBlob documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob).

For an optional physical-size readout:

~~~text
requiredPixels = centimetres / 2.54 * requestedDpi

Example:
15 cm at 300 dpi is approximately 1772 pixels.
10 cm at 300 dpi is approximately 1181 pixels.
~~~

This is a size calculation, not evidence that a downloaded file contains a matching dpi tag.

Render only decoded pixels into the exported artwork. Do not copy source EXIF/GPS data automatically. Verify this with a metadata-bearing fixture.

### 10.4 Large output, later

Tiling is needed when an output exceeds texture or memory limits, but it does not by itself solve final encoding memory.

A complete tiled implementation needs:

- Global design coordinates and identical seeds in every tile.
- A halo covering every blur, shadow, spread, and displacement dependency.
- Correct source sampling across tile boundaries.
- Final crops that discard the processing halo without seams.
- A streaming or strip-capable encoder, or a server worker.
- Memory accounting for the final output, not only individual tiles.

Do not advertise arbitrary-resolution output until this path has been built and verified.

### 10.5 Object, flat and image views

`output.view = object` includes paper, ink interaction, borders, layout, directional material lighting and optional stage/shadow. This is the default reference-inspired presentation.

`output.view = flat` retains paper albedo, ink interaction, contours and the arranged layout, under uniform neutral illumination. Suppress normal shading, specular highlights, sidewall cues and cast shadows. Retain paper mottling/fibre colour. The “Include shadow” switch is disabled with a brief explanation in this view.

`output.view = image` exports the photographic stage after basic finishing tone. It excludes per-fragment variation and all ink/paper/layout operations. Output aspect follows the oriented source crop, not the sheet/stage aspect; prevent stretching and confirm explicitly requested crop changes. Preserve original source alpha for PNG; composite onto the selected colour for JPEG or flattened PNG. Image processing must remain alpha-aware so transparent pixels do not create halos. Borders and shadows are inactive here.

Preview the selected view before export. All three use the same photographic intermediate, versioned recipe snapshot, colour handling and output limits. Flat is useful for further design and image-only for conventional photographic editing; neither is a calibrated physical printer proof. `composition.shortSideMm` is a material-scale reference and does not automatically write DPI metadata.

## 11. Hosted service and optional API

### 11.1 First-release hosting

Deploy the static editor over HTTPS when deployment is requested. Serve the application, fonts, samples, and licensed texture assets from the same origin where practical.

Images remain on the user's device during local editing and export. The initial application should make that claim only if verified by a network inspection.

A public landing page, account system, and payment system are separate from the core renderer. They can be added without changing the recipe model.

Provide a useful failure state if rendering is unavailable. Never display a successful export message for a missing or failed file.

### 11.2 Future server-rendering flow

Use a server only for capabilities that need it: very large outputs, API access, remote saved projects, or batch jobs.

A proposed flow:

1. The authenticated client requests an upload slot for a declared media type and size.
2. The service returns a short-lived upload destination.
3. The client uploads the source directly to private object storage.
4. The client submits a validated recipe and output request.
5. A bounded worker decodes the source, renders, and encodes the result.
6. The job returns a short-lived result URL.
7. Originals and results expire under the stated retention policy.

Do not send locally selected images to a server merely because the user moved a slider. Cloud rendering requires an explicit product action such as “Render large file”.

### 11.3 Proposed API contract

| Endpoint | Purpose |
|---|---|
| POST /v1/uploads | Create a private, size-limited upload slot. |
| POST /v1/recipes | Validate and store an immutable owned recipe snapshot; return its ID and renderer version. |
| POST /v1/render-jobs | Submit asset ID, recipe, renderer version, output size, and encoding choice. |
| GET /v1/render-jobs/:id | Return state, actual dimensions, progress stage, or an error. |
| POST /v1/render-jobs/:id/cancel | Request cancellation; handle a race with completion deterministically. |
| DELETE /v1/assets/:id | Delete owned source/output assets according to retention rules. |
| GET /v1/presets | Return versioned public presets. |

Example job request:

~~~json
{
  "sourceAssetId": "asset_example",
  "recipeId": "recipe_example",
  "rendererVersion": "0.2.0",
  "output": {
    "view": "object",
    "width": 4000,
    "height": 3000,
    "format": "png",
    "includeBackground": false,
    "includeShadow": true
  },
  "idempotencyKey": "client-generated-unique-request-id"
}
~~~

A recipe ID refers to a validated, immutable recipe snapshot. An API may instead accept that full recipe inline.

For initial cloud parity, run the same versioned rendering package in a controlled browser worker or a compatible GPU environment. A separately implemented CPU renderer needs its own version and a parity test suite; sharing the JSON schema alone does not make its output equivalent.

Job states:

~~~text
queued -> validating -> rendering -> encoding -> completed
                  -> failed
queued/rendering/encoding -> cancel_requested -> cancelled
~~~

Completion and cancellation must have a single authoritative final state. Idempotent retries must not create duplicate jobs or duplicate charges.

### 11.4 Service controls

- Validate access ownership for every asset and job.
- Use private storage and short-lived signed access.
- Restrict media types, byte count, decoded dimensions, render time, and concurrency.
- Do not allow user-supplied shaders or arbitrary remote input URLs.
- Use isolated render workers with bounded memory.
- Delete partial output from failed or cancelled jobs.
- Make retention explicit; a possible starting policy is 24 hours for temporary jobs, subject to the product's final requirements.
- Do not log image bytes, source EXIF, signed URLs, or user filenames in ordinary analytics.
- Separate anonymous presets from private images and private project data.
- Verify actual deletion and expiration rather than just hiding an asset from the UI.

### 11.5 Commercial scope

A browser-only editor has hosting and asset-delivery costs, but no required model inference cost per export. A server renderer introduces compute, storage, and transfer costs.

Measure cost per successful export using:

~~~text
worker time × compute rate
+ retained bytes × retention duration × storage rate
+ transferred bytes × transfer rate
+ queue/encoding overhead
~~~

Do not choose pricing or promise profit margins before measuring representative jobs. A possible product progression is free basic local editing, then paid batch work, cloud projects, or large exports. Billing is not a Release 1 dependency.

## 12. Input handling, performance, and resilience

### 12.1 Input contract

Proposed initial limits:

- Maximum encoded file size: 20 MB.
- Maximum decoded source area: 24 million pixels.
- Maximum source dimension: 12,000 pixels on either axis.
- Accept JPEG, PNG, and static WebP after checking actual file signatures.
- Reject animated PNG/WebP, GIF, SVG, PDF, RAW, and HEIC in Release 1 with an actionable message.
- Reject corrupt or truncated data without replacing the current valid project.

Check dimensions using safe header parsing before a potentially large decode. File extension and browser-reported MIME type are not sufficient.

Create an oriented preview first, and keep the original encoded Blob for later export. Use resize-aware decoding where supported, but assume the browser may temporarily allocate more memory than the requested preview.

Orientation, alpha, and resize options are documented for [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap). Wrap them in one tested input service to avoid double rotation or platform-dependent assumptions.

### 12.2 Quality tiers

| Tier | Starting policy |
|---|---|
| Interactive | Approximately 800–1,200 px long side; reduced sampling; same geometry, seeds, and transforms. |
| Refined | Approximately 1,600–2,000 px long side, constrained by viewport and memory. |
| Export | Selected pixel dimensions, maximum appropriate sampling, full render pipeline. |
| Detail inspection | Re-render a viewport region at 100% source/output scale when affordable. |

These are proposed defaults. Quality changes may adjust sample counts and antialiasing, but not change the underlying artwork.

### 12.3 Target measurements

The following are acceptance targets to test, not benchmarks already achieved:

- First usable preview of a normal 12 MP JPEG: target under 2 seconds on the documented reference desktop.
- Visible response to a slider: p95 under 100 ms in interactive quality on that desktop.
- Refined preview after idle: target under 800 ms for a typical single-sheet recipe.
- A 12 MP export: initial target under 10 seconds, measured separately for single-sheet and 36-fragment cases.
- No continuous render loop after the preview has settled.
- No monotonic growth in retained image/texture resources after repeated image replacement.

Record browser version, OS, GPU/device, source dimensions, recipe, and actual output dimensions alongside measurements. If a target is missed, report the measurements and improve the bottleneck; do not substitute an unmeasured claim.

### 12.4 Memory budget

At 4,000 × 3,000 pixels, one RGBA8 surface needs approximately 48 MB, excluding overhead. Four such surfaces need about 192 MB before source decode and encoding allocations.

Therefore:

- Reuse scratch surfaces.
- Prefer a few fused passes to many full-size intermediates.
- Avoid keeping full-resolution preview and export duplicates alive unnecessarily.
- Release export-only resources promptly.
- Estimate simultaneous CPU and GPU allocations before starting.
- Use conservative output options when the device's safe budget is unknown.
- Fail gracefully if allocation or encoding fails.

A 12 MP ceiling is not a promise that every phone can safely produce a 12 MP export.

### 12.5 Required errors and recovery

| Condition | User-facing response |
|---|---|
| Unsupported image | Name supported formats and suggest converting the image. |
| Oversized source | Explain the size limit without discarding the current work. |
| Corrupt image | Keep the existing project and offer another file. |
| Missing saved source | Restore settings and request relinking the photo. |
| Local storage full | Keep editing available; offer settings download. |
| Worker unavailable | Use the main-thread renderer if supported. |
| WebGL2 unavailable | Offer an honest implemented fallback, or explain device/browser requirements. |
| GPU context lost | Rebuild from retained source and recipe; preserve the user's controls. |
| Export exceeds limits | Offer supported dimensions before rendering. |
| Encoder failure | Report failure; do not download a corrupt or mislabelled file. |
| Export cancelled | Keep the editor usable and remove temporary output. |

Avoid copying technical stack traces into the main interface. Detailed diagnostics may be available in a development panel.

## 13. Validation plan and acceptance criteria

### 13.1 Test material

Use a small, documented set of original or licensed fixtures:

1. A dark landscape with fine branches.
2. A bright landscape with smooth sky gradients.
3. A colour portrait with natural skin and hair.
4. An image containing small readable lettering.
5. A numbered checkerboard for crop/partition integrity.
6. A PNG with soft transparency and coloured edge pixels.
7. A portrait-orientation JPEG with EXIF orientation.
8. A source with an embedded colour profile and metadata.
9. A large image near the supported input limit.
10. Corrupt, animated, and unsupported inputs.

Do not use the artist's downloaded originals as bundled product samples or infer permission to redistribute them from their public availability.

### 13.2 Functional acceptance

- A user can load, crop, finish, compare, undo, and export an image without signing in.
- Every visible control is connected to a real rendering or composition parameter.
- Group bypass restores the result without that contribution and preserves saved values.
- Overall strength 0 produces the neutral photographic finish in the same intentional layout.
- The same recipe and source reproduce the same composition after restoration.
- A changed seed affects only its declared random component and physical dependants.
- Input replacement and export cancellation do not corrupt the project.
- JPEG and PNG reopen correctly with the requested dimensions and expected alpha/background.
- Recipe export/import works and reports a missing source honestly.
- At least one complete browser flow is verified using an actual downloaded output.

### 13.3 Numerical and geometry checks

**Neutral colour:** Compare the printed-image region against the same oriented/cropped sRGB source passed through the baseline render path. Target a maximum difference of 2 code values per channel in uncomplicated interior pixels, excluding deliberate resampling/alpha boundaries. This is not a byte comparison of compressed files.

**Seed stability:** Assert stable contour/field identifiers and stable representative samples before and after unrelated control changes.

**Partition integrity:** With tears and scatter at zero, source partitions cover the crop once. Reconstruct the checkerboard before gap translation and detect missing/duplicated cells.

**Crop and orientation:** Test portrait EXIF images, mirrored orientation cases, and non-square crops. Never correct orientation twice.

**Alpha:** Place the transparent PNG over black, white, and saturated backgrounds. Reject light/dark rectangular halos and clipped wisps.

**Bounds:** At permitted maximum edge/shadow values, all intended material remains inside the output envelope.

**Recipe validation:** Test bad ranges, unknown schema versions, unordered cuts, excessive grid counts, and oversized JSON.

### 13.4 Visual acceptance

Compare both the whole artwork and close details:

- Paper looks fibrous rather than like a uniform noise overlay.
- Dark printed regions preserve depth and do not become washed out at moderate paper strength.
- The border remains distinctly unprinted.
- Internal fibres and perimeter fibres have different visual roles.
- Deckled and torn edge profiles are visibly different.
- Wrinkles form coherent ridges and valleys.
- Surface light and cast shadow agree.
- Strips align as pieces of the same source before spacing.
- Fragment toning is subtle at low values and visibly varied at high values.
- Grain remains tied to the photograph while paper remains tied to the support.
- A full-bleed image does not acquire an automatic white outline.
- Colour mode preserves plausible skin colour at moderate material settings.

Use side-by-side reference-inspired reviews, not pixel matching against the artist's artwork.

### 13.5 Preview/export agreement

Take a high-resolution export, downsample it with a documented filter, and compare it with a refined preview of the same scene at the same dimensions.

Assess separately:

- Source framing and piece placement.
- Tear locations and outer contour.
- Low-frequency tonal response.
- Grain/fibre statistics after equivalent low-pass filtering.
- Alpha and shadow boundaries.

Proposed initial gate: no visible geometric shift; low-frequency luminance error below 2/255 on a neutral test; no obvious change in texture scale. Choose and record final tolerances after the baseline renderer is implemented.

Do not require exact equality between a low-sample interactive preview and a full-quality export. Do not use that fact to excuse a different crop, different seed, or differently scaled material.

### 13.6 User-flow and accessibility checks

- Keyboard users can reach and adjust every control.
- Sliders have labels and meaningful current values.
- Focus remains visible.
- Controls do not rely solely on colour to communicate state.
- Compare, reset, and export work without hover-only actions.
- Touch targets are practical on the mobile layout.
- Long filenames and narrow screens do not obscure export controls.
- Opening/closing panels does not alter the artwork.
- Network inspection confirms that local editing/export does not transmit the user's image.

### 13.7 Definition of done

Release 1 is complete only when:

- All Release 1 controls and three layouts work.
- Six artwork presets, fourteen film profiles and seven material recipes are implemented as validated, versioned data.
- B&W filters/mixer/toner and all three export views work.
- Captured/hybrid material-map support works; original/licensed captured assets meet the material-library quality gate or the remaining asset gap is explicitly reported as unfinished.
- The renderer and export share canonical logic.
- No visible control is a placeholder.
- The test flows above pass or documented limitations are explicitly resolved with the product owner.
- Production build succeeds.
- A README explains setup, supported files, processing location, limitations, and test commands.
- Asset provenance is recorded.
- Performance figures are measured and reported.
- The final handoff includes a runnable local editor and sample exports.

The specification itself does not claim these checks have passed.

### 13.8 Film, B&W and realistic material gates

Run the twelve added acceptance groups in the companion, Section 9. They cover film-profile differentiation, neutral-axis response, B&W equality and colour filtering, highlight isolation, grain statistics/format, relighting, material diversity, versioned maps, export views, migration and resource budgets. Add grey ramps, coloured patches, a night point-light scene and smooth/fibrous/coated material fixtures to the existing test set.

Use film/material information panels to distinguish authored approximations, inferred maps and measured/captured assets. A functioning procedural fallback does not establish captured-material fidelity. Paired-film calibration is later work and is not necessary to call the initial profiles film-inspired.

## 14. Implementation sequence

### Milestone A — input-to-export proof

Build the editor shell, source decoding, orientation, crop, neutral renderer, basic tone controls, and PNG/JPEG export. Confirm that a real user file completes the journey.

Gate: output dimensions, orientation, and baseline colour are correct.

### Milestone B — film and B&W

Implement the single photographic pipeline, fourteen versioned response profiles, B&W conversion/filter/mixer/toner, one grain engine, development character and source-isolated halation/bloom. Add image-only preview and export. Keep the pipeline independent of material rendering.

Gate: grey/colour/highlight fixtures pass; profiles differ appropriately; full neutral B&W has no coloured grain; output preserves source geometry.

### Milestone C — paper, ink and light

Implement seven material families, procedural and captured/hybrid map paths, paper/image masks, deckled contours, fibres, ink coupling, shallow wrinkles, thickness cues, diffuse/coating response and shared light/shadows. Add the original/licensed material sets and provenance. Include flat export. If asset acquisition is unavailable, continue with honest procedural fallbacks and report the remaining library quality gate.

Gate: materials differ under relighting, no baked double shadows or plastic surfaces, clean alpha, and every active control has its intended contribution.

### Milestone D — strips and fragments

Implement source partitions, corresponding torn boundaries, gaps, fragment tone offsets, and bounded scatter.

Gate: checkerboard continuity and zero-gap reconstruction pass.

### Milestone E — product completion

Implement all artwork/film/material recipes, comparison/detail/light-inspection views, grouped controls, undo/redo, schema-2 validation and migration, settings import/export, explicit browser save, responsiveness, and recovery.

Gate: full normal and error user journeys work.

### Milestone F — hardening

Check preview/export agreement, resource lifecycle, output caps, device fallbacks, build quality, accessibility, and licensed assets.

Gate: deliver measured results and example output files; no claim of completeness based only on a screenshot.

Milestones are implementation order, not separate permission checkpoints. Continue through the authorised Release 1 work when executing the Codex prompt.

## 15. Risks, tradeoffs, and chosen defaults

| Risk or decision | Chosen approach |
|---|---|
| One “vintage” slider hides the actual visual layers. | Independent groups plus a predictable overall strength. |
| Many sliders overwhelm the user. | Presets, primary controls, collapsible advanced controls. |
| Procedural texture looks synthetic. | Multiple independent scales and a captured/hybrid map path now; original/licensed material library quality gate with explicitly labelled fallback. |
| Stock names hide arbitrary colour filters. | Primary-source directions, versioned authored recipes, a declared target pipeline, and later measured calibration. |
| All film looks become grain plus saturation. | Separate neutral curves, hue response, channel grain behaviour, B&W sensitivity and source-highlight effects. |
| Paper gloss looks plastic. | Nonmetallic coating, restrained sheen, roughness and a shared area-light model. |
| A global blur destroys faces and lettering. | Small, separately controlled image softness and ink spread. |
| A rough edge looks like a sticker. | Paper-aware fibre colour, thin thickness cues, restrained shadows. |
| Preview and export diverge. | Shared renderer, fixed design coordinates, saved seeds and versions. |
| A generative model changes the source. | Deterministic image processing for the core editor. |
| A single photo cannot reproduce relationships between unrelated photos. | Continuous split modes now, explicit multi-photo composition later. |
| The exported image claims a physical print process it did not undergo. | Label finishes as inspired simulations; retain material/process distinctions. |
| Browser output limits vary. | Runtime capability checks, bounded export, no silent resizing. |
| The app becomes a large SaaS project before the effect works. | Local editor first; cloud API and monetisation later. |
| The paper looks equally textured everywhere. | Distinct albedo, relief, ink coverage, and edge models. |
| Colour profiles produce unexpected results. | Tested SDR sRGB normalisation and honest limitations. |

## 16. Ready-to-use prompt for Codex

Copy the following prompt into a Codex coding task with this Markdown document available in the project. It requests implementation, not another planning document.

~~~text
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
~~~

## 17. Document handoff checklist

This document provides:

- A sourced analysis of the reference style and confirmed production practices.
- A separation between photographic choices, simulated materials, and composition.
- Release 1 requirements with later features explicitly separated.
- A complete parameter inventory and neutral/strength semantics.
- Six artwork presets, fourteen film profile recipes and seven paper material families, with sourced companion research.
- Dedicated B&W controls, realistic material-map requirements and three export views.
- A deterministic rendering model, coordinate system, colour/alpha contract, and export design.
- An example versioned project recipe.
- A recommended local architecture and a future service API.
- Input, performance, memory, privacy, and failure-handling requirements.
- Acceptance criteria and implementation milestones.
- A complete Codex implementation prompt.

Open product choices are already given workable defaults here. Before a public commercial release, decide final branding, deployment provider, support policy, pricing, and whether the next priority is multiple-photo composition or large cloud exports. None of those decisions blocks implementing the local Release 1 editor.
